import {useMemo} from 'react';
import {useVault} from '../VaultProvider';
import {
  KINDS,
  entryTitle,
  formatBytes,
  formatDateTime,
  isVisible,
  plainText,
  wordCount,
  type Entry,
} from '../lib/model';
import {renderMarkdown} from '../lib/markdown';
import {
  IconArrowLeft,
  IconEdit,
  IconExternal,
  IconImage,
  IconPaperclip,
  IconPin,
  IconRestore,
  IconShare,
  IconStar,
  IconTrash,
} from './Icons';

type Props = {
  entry: Entry;
  onEdit: () => void;
  onDelete: () => void;
  onRestore: () => void;
  onPurge: () => void;
  onTogglePin: () => void;
  onToggleFavorite: () => void;
  onOpenEntry: (entry: Entry) => void;
  onBack: () => void;
};

const hostOf = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

export const EntryDetail = ({
  entry,
  onEdit,
  onDelete,
  onRestore,
  onPurge,
  onTogglePin,
  onToggleFavorite,
  onOpenEntry,
  onBack,
}: Props) => {
  const {entries, attachmentUrls, notify} = useVault();
  const kind = KINDS[entry.kind];
  const words = useMemo(() => wordCount(plainText(entry.body)), [entry.body]);
  const html = useMemo(
    () => renderMarkdown(entry.body, {resolveImage: (id) => attachmentUrls[id], newTabLinks: true}),
    [entry.body, attachmentUrls],
  );
  const images = entry.attachments.filter((item) => item.mime.startsWith('image/'));
  const files = entry.attachments.filter((item) => !item.mime.startsWith('image/'));
  const related = useMemo(() => {
    const tags = new Set(entry.tags.map((tag) => tag.toLowerCase()));
    return entries
      .filter((candidate) => candidate.id !== entry.id && isVisible(candidate))
      .map((candidate) => {
        const shared = candidate.tags.filter((tag) => tags.has(tag.toLowerCase())).length;
        const bonus = candidate.kind === entry.kind ? 0.5 : 0;
        return {entry: candidate, score: shared + bonus};
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || b.entry.updatedAt - a.entry.updatedAt)
      .slice(0, 4)
      .map((item) => item.entry);
  }, [entries, entry]);

  const copyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(entry.body);
      notify('正文已复制', 'good');
    } catch {
      notify('浏览器没有允许复制', 'bad');
    }
  };

  return (
    <article className="vault-detail">
      <header className="vault-detail__bar">
        <button type="button" className="vault-textbtn vault-detail__back" onClick={onBack}>
          <IconArrowLeft size={16} /> 返回列表
        </button>
        <div className="vault-detail__actions">
          <button
            type="button"
            className={`vault-iconbtn${entry.favorite ? ' is-active' : ''}`}
            aria-label={entry.favorite ? '取消收藏' : '收藏'}
            title={entry.favorite ? '取消收藏' : '收藏'}
            onClick={onToggleFavorite}
          >
            <IconStar size={17} />
          </button>
          <button
            type="button"
            className={`vault-iconbtn${entry.pinned ? ' is-active' : ''}`}
            aria-label={entry.pinned ? '取消置顶' : '置顶'}
            title={entry.pinned ? '取消置顶' : '置顶'}
            onClick={onTogglePin}
          >
            <IconPin size={17} />
          </button>
          <button type="button" className="vault-iconbtn" aria-label="复制正文" title="复制正文" onClick={copyMarkdown}>
            <IconShare size={17} />
          </button>
          {entry.deletedAt ? null : (
            <button type="button" className="vault-iconbtn" aria-label="编辑" title="编辑" onClick={onEdit}>
              <IconEdit size={17} />
            </button>
          )}
          {entry.deletedAt ? (
            <>
              <button type="button" className="vault-textbtn" onClick={onRestore}>
                <IconRestore size={15} /> 恢复
              </button>
              <button type="button" className="vault-textbtn vault-textbtn--danger" onClick={onPurge}>
                <IconTrash size={15} /> 彻底删除
              </button>
            </>
          ) : (
            <button type="button" className="vault-iconbtn" aria-label="移到回收站" title="移到回收站" onClick={onDelete}>
              <IconTrash size={17} />
            </button>
          )}
        </div>
      </header>

      {entry.deletedAt && (
        <div className="vault-detail__trash">
          这条记录在回收站里，将在 30 天后自动清除。删除时间：{formatDateTime(entry.deletedAt)}
        </div>
      )}

      <div className="vault-detail__scroll">
        <div className="vault-detail__head">
          <span className="vault-detail__kind" style={{color: kind.color}}>
            {kind.en} <em>{kind.label}</em>
          </span>
          <h1>{entryTitle(entry)}</h1>
          <div className="vault-detail__meta">
            <span>创建 {formatDateTime(entry.createdAt)}</span>
            <span>更新 {formatDateTime(entry.updatedAt)}</span>
            <span>{words} 词</span>
          </div>
          {entry.tags.length > 0 && (
            <div className="vault-detail__tags">
              {entry.tags.map((tag) => (
                <span key={tag} className="vault-tagchip is-static">
                  #{tag}
                </span>
              ))}
            </div>
          )}
          {entry.url && (
            <a className="vault-detail__url" href={entry.url} target="_blank" rel="noreferrer">
              <IconExternal size={15} />
              <span>{hostOf(entry.url)}</span>
              <em>{entry.url}</em>
            </a>
          )}
        </div>

        {html.trim() ? (
          <div className="vault-prose" dangerouslySetInnerHTML={{__html: html}} />
        ) : (
          <p className="vault-detail__emptybody">{kind.hint}。点右上角的编辑把它写下来。</p>
        )}

        {images.length > 0 && (
          <div className="vault-detail__gallery">
            {images.map((item) => {
              const url = attachmentUrls[item.id];
              return url ? (
                <a key={item.id} href={url} target="_blank" rel="noreferrer" className="vault-thumb" title={item.name}>
                  <img src={url} alt={item.name} loading="lazy" />
                  <span>
                    <IconImage size={13} /> {item.name}
                  </span>
                </a>
              ) : (
                <span key={item.id} className="vault-thumb is-loading">
                  <span className="vault-thumb__placeholder" />
                  <span>{item.name}</span>
                </span>
              );
            })}
          </div>
        )}

        {files.length > 0 && (
          <div className="vault-detail__files">
            <h2>附件</h2>
            {files.map((item) => {
              const url = attachmentUrls[item.id];
              return (
                <div key={item.id} className="vault-file">
                  <IconPaperclip size={16} />
                  <span className="vault-file__name">{item.name}</span>
                  <em>{formatBytes(item.size)}</em>
                  {url ? (
                    <a className="vault-textbtn" href={url} download={item.name}>
                      下载
                    </a>
                  ) : (
                    <span className="vault-file__pending">读取中…</span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {related.length > 0 && (
          <div className="vault-detail__related">
            <h2>相关的记录</h2>
            <div className="vault-related-grid">
              {related.map((item) => (
                <button key={item.id} type="button" className="vault-related" onClick={() => onOpenEntry(item)}>
                  <span className="vault-related__kind" style={{color: KINDS[item.kind].color}}>
                    {KINDS[item.kind].en}
                  </span>
                  <strong>{entryTitle(item)}</strong>
                  <em>{formatDateTime(item.updatedAt)}</em>
                </button>
              ))}
            </div>
          </div>
        )}

        <footer className="vault-detail__foot">
          <span>这条记录已加密保存在本机。</span>
          <button type="button" className="vault-textbtn" onClick={copyMarkdown}>
            复制 Markdown
          </button>
        </footer>
      </div>
    </article>
  );
};
