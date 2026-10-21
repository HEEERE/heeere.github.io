import {useCallback, useEffect, useMemo, useRef, useState, type ClipboardEvent, type DragEvent} from 'react';
import {useVault} from '../VaultProvider';
import {
  KINDS,
  KIND_LIST,
  cloneEntry,
  formatBytes,
  splitTags,
  wordCount,
  type Entry,
  type EntryKind,
} from '../lib/model';
import {renderMarkdown} from '../lib/markdown';
import {pickFile} from '../lib/download';
import {
  IconCheck,
  IconClose,
  IconEdit,
  IconImage,
  IconPaperclip,
  IconTrash,
} from './Icons';

type Props = {
  initial: Entry;
  isNew: boolean;
  onClose: () => void;
  onSaved: (entry: Entry) => void;
};

type Tab = 'write' | 'preview';

const TOOLBAR: {label: string; title: string; before: string; after: string}[] = [
  {label: 'H2', title: '小标题', before: '## ', after: ''},
  {label: 'B', title: '加粗', before: '**', after: '**'},
  {label: 'I', title: '斜体', before: '*', after: '*'},
  {label: '`', title: '行内代码', before: '`', after: '`'},
  {label: '>', title: '引用', before: '> ', after: ''},
  {label: '•', title: '列表', before: '- ', after: ''},
  {label: '1.', title: '编号列表', before: '1. ', after: ''},
  {label: '—', title: '分隔线', before: '\n---\n', after: ''},
];

export const Composer = ({initial, isNew, onClose, onSaved}: Props) => {
  const {addAttachments, saveEntry, removeAttachment, ensureAttachmentUrls, attachmentUrls, notify} = useVault();
  const [draft, setDraft] = useState<Entry>(() => cloneEntry(initial));
  const [tab, setTab] = useState<Tab>('write');
  const [tagInput, setTagInput] = useState(initial.tags.join(' '));
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  const initialRef = useRef(initial);
  const existing = initialRef.current;

  const dirty = useMemo(() => {
    const base = existing;
    return (
      base.title !== draft.title ||
      base.body !== draft.body ||
      base.url !== draft.url ||
      base.kind !== draft.kind ||
      base.tags.join('\u0000') !== draft.tags.join('\u0000') ||
      base.attachments.map((item) => item.id).join() !== draft.attachments.map((item) => item.id).join()
    );
  }, [draft, existing]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (isNew) titleRef.current?.focus();
      else bodyRef.current?.focus();
    }, 120);
    return () => window.clearTimeout(timer);
  }, [isNew]);

  useEffect(() => {
    ensureAttachmentUrls(draft.attachments.map((item) => item.id));
  }, [draft.attachments, ensureAttachmentUrls]);

  const update = (patch: Partial<Entry>) => setDraft((current) => ({...current, ...patch}));

  const close = useCallback(() => {
    if (dirty && !window.confirm('放弃未保存的修改？')) return;
    onClose();
  }, [dirty, onClose]);

  const save = useCallback(async () => {
    if (busy) return;
    if (!draft.title.trim() && !draft.body.trim()) {
      notify('空白的记录不会被保存', 'bad');
      titleRef.current?.focus();
      return;
    }
    setBusy(true);
    try {
      const tags = tagInput.trim() ? splitTags(tagInput) : [];
      const saved = await saveEntry({...draft, tags, updatedAt: Date.now()});
      onSaved(saved);
      notify(isNew ? '已经收进庭院' : '修改已保存', 'good');
    } catch {
      notify('保存失败，请再试一次', 'bad');
    } finally {
      setBusy(false);
    }
  }, [busy, draft, isNew, notify, onSaved, saveEntry, tagInput]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        void save();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [save]);

  const insert = (before: string, after: string) => {
    const textarea = bodyRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    const selected = value.slice(start, end);
    const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
    update({body: next});
    requestAnimationFrame(() => {
      textarea.focus();
      const caret = start + before.length + selected.length + after.length;
      textarea.setSelectionRange(selected ? caret : start + before.length, selected ? caret : start + before.length);
    });
  };

  const upload = async (files: File[]) => {
    if (!files.length) return;
    setUploading(true);
    try {
      const refs = await addAttachments(files);
      update({attachments: [...draft.attachments, ...refs]});
      notify(refs.length > 1 ? `已加入 ${refs.length} 个附件` : '已加入附件', 'good');
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : '附件读取失败', 'bad');
    } finally {
      setUploading(false);
    }
  };

  const onPaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(event.clipboardData.files);
    if (files.length > 0) {
      event.preventDefault();
      void upload(files);
      return;
    }
    const image = Array.from(event.clipboardData.items).find((item) => item.type.startsWith('image/'));
    if (image) {
      const file = image.getAsFile();
      if (file) {
        event.preventDefault();
        void upload([file]);
      }
    }
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    const files = Array.from(event.dataTransfer.files);
    if (files.length) void upload(files);
  };

  const removeRef = async (id: string) => {
    update({attachments: draft.attachments.filter((item) => item.id !== id)});
    if (!isNew) {
      try {
        await removeAttachment(existing.id, id);
      } catch {
        /* the reference was already dropped from the draft */
      }
    }
  };

  const changeKind = (kind: EntryKind) => {
    const oldTemplate = KINDS[draft.kind].template;
    const body = draft.body === oldTemplate ? KINDS[kind].template : draft.body;
    update({kind, body});
    if (kind === 'clip' && !draft.url) urlRef.current?.focus();
  };

  const preview = useMemo(
    () => renderMarkdown(draft.body, {resolveImage: (id) => attachmentUrls[id], newTabLinks: true}),
    [draft.body, attachmentUrls],
  );

  return (
    <div className="vault-modal" role="dialog" aria-modal="true" aria-label="编辑记录">
      <button type="button" className="vault-modal__scrim" aria-label="关闭" onClick={close} />
      <div className="vault-composer">
        <header className="vault-composer__head">
          <div>
            <span className="vault-composer__eyebrow">{isNew ? 'NEW ENTRY' : 'EDIT ENTRY'}</span>
            <h2>{isNew ? '写一条新记录' : '编辑记录'}</h2>
          </div>
          <div className="vault-composer__head-actions">
            <span className="vault-composer__words">{wordCount(draft.body)} 词</span>
            <button type="button" className="vault-iconbtn" aria-label="关闭" onClick={close}>
              <IconClose size={18} />
            </button>
          </div>
        </header>

        <div className="vault-composer__kinds">
          {KIND_LIST.map((item) => (
            <button
              key={item}
              type="button"
              className={`vault-kindbtn${draft.kind === item ? ' is-active' : ''}`}
              style={draft.kind === item ? {borderColor: KINDS[item].color, color: KINDS[item].color} : undefined}
              onClick={() => changeKind(item)}
            >
              {KINDS[item].label}
            </button>
          ))}
        </div>

        <div className="vault-composer__fields">
          <input
            ref={titleRef}
            className="vault-composer__title"
            value={draft.title}
            placeholder="标题（可以留空，会从正文里取）"
            onChange={(event) => update({title: event.target.value})}
          />
          <input
            ref={urlRef}
            className="vault-composer__url"
            value={draft.url}
            placeholder="链接（可选，http:// 或 https://）"
            inputMode="url"
            onChange={(event) => update({url: event.target.value})}
          />
          <div className="vault-composer__tags">
            <span>标签</span>
            <input
              value={tagInput}
              placeholder="用空格分隔，例如：Agent 安全 笔记"
              onChange={(event) => setTagInput(event.target.value)}
              onBlur={() => {
                if (tagInput.trim()) {
                  const tags = splitTags(tagInput);
                  setTagInput(tags.join(' '));
                  update({tags});
                }
              }}
            />
          </div>
        </div>

        <div className="vault-composer__editor">
          <div className="vault-composer__toolbar">
            <div className="vault-tabs">
              <button type="button" className={tab === 'write' ? 'is-active' : ''} onClick={() => setTab('write')}>
                <IconEdit size={14} /> 编辑
              </button>
              <button type="button" className={tab === 'preview' ? 'is-active' : ''} onClick={() => setTab('preview')}>
                <IconImage size={14} /> 预览
              </button>
            </div>
            {tab === 'write' && (
              <div className="vault-tools">
                {TOOLBAR.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    title={item.title}
                    onClick={() => insert(item.before, item.after)}
                  >
                    {item.label}
                  </button>
                ))}
                <span className="vault-tools__sep" />
                <button type="button" title="插入图片" onClick={() => void pickFile('image/*', true).then(upload)}>
                  <IconImage size={15} />
                </button>
                <button type="button" title="添加附件" onClick={() => void pickFile('*/*', true).then(upload)}>
                  <IconPaperclip size={15} />
                </button>
              </div>
            )}
          </div>

          {tab === 'write' ? (
            <div
              className={`vault-editorwrap${dragging ? ' is-dragging' : ''}`}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              <textarea
                ref={bodyRef}
                className="vault-editor"
                value={draft.body}
                placeholder="开始写。支持 Markdown，可以粘贴或拖入图片。"
                spellCheck={false}
                onChange={(event) => update({body: event.target.value})}
                onPaste={onPaste}
              />
              {dragging && <span className="vault-editorwrap__hint">松手，把文件收进来</span>}
            </div>
          ) : (
            <div className="vault-editorpreview">
              {preview.trim() ? (
                <div className="vault-prose" dangerouslySetInnerHTML={{__html: preview}} />
              ) : (
                <p className="vault-prose__empty">还没有内容。</p>
              )}
            </div>
          )}
        </div>

        {draft.attachments.length > 0 && (
          <div className="vault-composer__attachments">
            {draft.attachments.map((item) => {
              const url = attachmentUrls[item.id];
              return (
                <div key={item.id} className="vault-attach">
                  {url && item.mime.startsWith('image/') ? (
                    <img src={url} alt={item.name} />
                  ) : (
                    <span className="vault-attach__icon">
                      <IconPaperclip size={18} />
                    </span>
                  )}
                  <span className="vault-attach__name">{item.name}</span>
                  <em>{formatBytes(item.size)}</em>
                  <button type="button" aria-label={`移除 ${item.name}`} onClick={() => void removeRef(item.id)}>
                    <IconTrash size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <footer className="vault-composer__foot">
          <span className="vault-composer__hint">
            {uploading ? '正在处理附件…' : '⌘/Ctrl + Enter 保存 · 内容加密后写入本机'}
          </span>
          <div className="vault-composer__buttons">
            <button type="button" className="vault-btn" onClick={close}>
              取消
            </button>
            <button type="button" className="vault-btn vault-btn--primary" onClick={() => void save()} disabled={busy || uploading}>
              <IconCheck size={16} /> {busy ? '保存中…' : '保存'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
