import {
  KINDS,
  dayKey,
  entrySnippet,
  entryTitle,
  formatDay,
  formatTime,
  relativeDay,
  type Entry,
  type EntryFilter,
} from '../lib/model';
import {IconImage, IconPaperclip, IconPin, IconPlus, IconSearch, IconStar, IconTrash} from './Icons';

type View = EntryFilter['view'];

type Props = {
  title: string;
  view: View;
  sort: 'updated' | 'created' | 'title';
  entries: Entry[];
  query: string;
  onSort: (sort: 'updated' | 'created' | 'title') => void;
  onOpen: (entry: Entry) => void;
  onEdit: (entry: Entry) => void;
  onNew: () => void;
  onEmptyTrash: () => void;
};

const emptyCopy = (view: View, query: string): {title: string; body: string} => {
  if (query) return {title: '没有找到匹配的记录', body: '换一个词试试，或者按下 Esc 清空搜索。'};
  if (view === 'trash') return {title: '回收站是空的', body: '删除的记录会在这里停留 30 天。'};
  if (view === 'star') return {title: '还没有收藏', body: '在详情里点一下星标，重要的内容就会留在这里。'};
  return {title: '这里还是空的', body: '写下第一条记录。它会立刻加密，并且只属于这台设备。'};
};

export const EntryList = ({title, view, sort, entries, query, onSort, onOpen, onEdit, onNew, onEmptyTrash}: Props) => {
  const groups: {key: string; label: string; date: string; items: Entry[]}[] = [];
  for (const entry of entries) {
    const key = dayKey(entry.updatedAt);
    const existing = groups.find((group) => group.key === key);
    if (existing) existing.items.push(entry);
    else groups.push({key, label: relativeDay(entry.updatedAt), date: formatDay(entry.updatedAt), items: [entry]});
  }
  const empty = emptyCopy(view, query.trim());

  return (
    <div className="vault-list">
      <header className="vault-list__head">
        <div>
          <h1>{title}</h1>
          <span className="vault-list__count">
            {entries.length} 条{query ? ` · 搜索「${query.trim()}」` : ''}
          </span>
        </div>
        <div className="vault-list__tools">
          {view === 'trash' && entries.length > 0 && (
            <button type="button" className="vault-textbtn vault-textbtn--danger" onClick={onEmptyTrash}>
              <IconTrash size={15} /> 清空
            </button>
          )}
          <label className="vault-select">
            <span className="sr-only">排序</span>
            <select value={sort} onChange={(event) => onSort(event.target.value as 'updated' | 'created' | 'title')}>
              <option value="updated">最近修改</option>
              <option value="created">创建时间</option>
              <option value="title">标题</option>
            </select>
          </label>
        </div>
      </header>

      {entries.length === 0 ? (
        <div className="vault-list__empty">
          <span className="vault-list__empty-mark">{query ? <IconSearch size={22} /> : <IconPlus size={22} />}</span>
          <h2>{empty.title}</h2>
          <p>{empty.body}</p>
          {!query && view !== 'trash' && (
            <button type="button" className="vault-btn vault-btn--primary" onClick={onNew}>
              <IconPlus size={16} /> 新建记录
            </button>
          )}
        </div>
      ) : (
        <div className="vault-list__body">
          {groups.map((group) => (
            <section key={group.key} className="vault-daygroup">
              <header className="vault-daygroup__head">
                <span>{group.label}</span>
                <em>{group.date}</em>
              </header>
              <div className="vault-cards">
                {group.items.map((entry) => (
                  <article key={entry.id} className="vault-card">
                    <button type="button" className="vault-card__hit" onClick={() => onOpen(entry)}>
                      <span className="vault-card__kind" style={{color: KINDS[entry.kind].color}}>
                        {KINDS[entry.kind].en}
                      </span>
                      <span className="vault-card__title">{entryTitle(entry)}</span>
                      <span className="vault-card__snippet">{entrySnippet(entry, query, 96)}</span>
                      <span className="vault-card__meta">
                        <em>{formatTime(entry.updatedAt)}</em>
                        {entry.attachments.length > 0 && (
                          <span className="vault-card__flag">
                            {entry.attachments.some((item) => item.mime.startsWith('image/')) ? (
                              <IconImage size={14} />
                            ) : (
                              <IconPaperclip size={14} />
                            )}
                            {entry.attachments.length}
                          </span>
                        )}
                        {entry.favorite && (
                          <span className="vault-card__flag">
                            <IconStar size={14} />
                          </span>
                        )}
                        {entry.pinned && (
                          <span className="vault-card__flag">
                            <IconPin size={14} />
                          </span>
                        )}
                        {entry.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="vault-card__tag">
                            #{tag}
                          </span>
                        ))}
                      </span>
                    </button>
                    {view !== 'trash' && (
                      <button
                        type="button"
                        className="vault-card__edit"
                        aria-label="编辑"
                        onClick={() => onEdit(entry)}
                      >
                        编辑
                      </button>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};
