import type {EntryFilter, EntryKind, LocalSettings} from '../lib/model';
import {KINDS, KIND_LIST} from '../lib/model';
import {
  IconClose,
  IconCloud,
  IconLock,
  IconPin,
  IconPlus,
  IconSettings,
  IconStar,
  IconTrash,
  IconClock,
} from './Icons';

type View = EntryFilter['view'];

type Props = {
  settings: LocalSettings;
  syncLabel: string;
  view: View;
  kind?: EntryKind;
  tag?: string;
  counts: {
    today: number;
    all: number;
    starred: number;
    trash: number;
    kinds: Record<EntryKind, number>;
  };
  tags: {tag: string; count: number}[];
  onSelect: (view: View, kind?: EntryKind, tag?: string) => void;
  onOpenSettings: () => void;
  onNew: () => void;
  onOpenRandom: () => void;
  onLock: () => void;
  onCloseDrawer: () => void;
};

const navClass = (active: boolean): string => `vault-nav__item${active ? ' is-active' : ''}`;

export const Sidebar = ({
  settings,
  syncLabel,
  view,
  kind,
  tag,
  counts,
  tags,
  onSelect,
  onOpenSettings,
  onNew,
  onOpenRandom,
  onLock,
  onCloseDrawer,
}: Props) => {
  const connected = Boolean(settings.dshPairUrl);
  const syncDot =
    syncLabel === '正在同步…' ? 'syncing' : syncLabel === '同步失败' ? 'error' : syncLabel === '已同步' ? 'ok' : 'idle';

  return (
    <aside className="vault-sidebar" aria-label="庭院导航">
      <header className="vault-brand">
        <a className="vault-brand__seal" href="/" title="回到公共主页" aria-label="回到公共主页">
          箱
        </a>
        <div className="vault-brand__text">
          <strong>喆元的庭院</strong>
          <span>PRIVATE GARDEN</span>
        </div>
        <button type="button" className="vault-iconbtn vault-brand__close" aria-label="关闭菜单" onClick={onCloseDrawer}>
          <IconClose size={18} />
        </button>
      </header>

      <div className="vault-sidebar__scroll">
        <nav className="vault-nav">
          <button type="button" className={navClass(view === 'today')} onClick={() => onSelect('today')}>
            <IconClock size={17} />
            <span>今天</span>
            <em>{counts.today}</em>
          </button>
          <button type="button" className={navClass(view === 'all')} onClick={() => onSelect('all')}>
            <IconPin size={17} />
            <span>全部记录</span>
            <em>{counts.all}</em>
          </button>
          <button type="button" className={navClass(view === 'star')} onClick={() => onSelect('star')}>
            <IconStar size={17} />
            <span>收藏</span>
            <em>{counts.starred}</em>
          </button>
        </nav>

        <section className="vault-sidebar__section">
          <h3>分类</h3>
          <nav className="vault-nav vault-nav--kinds">
            {KIND_LIST.map((item) => (
              <button
                key={item}
                type="button"
                className={navClass(view === 'kind' && kind === item)}
                onClick={() => onSelect('kind', item)}
              >
                <span className="vault-kinddot" style={{background: KINDS[item].color}} />
                <span>{KINDS[item].label}</span>
                <em>{counts.kinds[item]}</em>
              </button>
            ))}
          </nav>
        </section>

        {tags.length > 0 && (
          <section className="vault-sidebar__section">
            <h3>标签</h3>
            <div className="vault-tagcloud">
              {tags.map((item) => (
                <button
                  key={item.tag}
                  type="button"
                  className={`vault-tagchip${view === 'tag' && tag === item.tag ? ' is-active' : ''}`}
                  onClick={() => onSelect('tag', undefined, item.tag)}
                >
                  #{item.tag}
                  <em>{item.count}</em>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      <footer className="vault-sidebar__footer">
        <div className="vault-sidebar__actions">
          <button type="button" className="vault-sidebar__new" onClick={onNew}>
            <IconPlus size={16} />
            <span>新建记录</span>
            <kbd>⌘N</kbd>
          </button>
          <button type="button" className="vault-sidebar__link" onClick={onOpenRandom}>
            随机翻一页
          </button>
        </div>

        <div className="vault-device">
          <div className="vault-device__row">
            <IconCloud size={15} />
            <span className={`vault-dot vault-dot--${syncDot}`} />
            <span>{syncLabel}</span>
            {settings.sync?.repo && <em>{settings.sync.repo}</em>}
          </div>
          <div className="vault-device__row">
            <IconLock size={15} />
            <span>{settings.deviceName || '这台设备'}</span>
            <span className={`vault-chip${connected ? ' is-ok' : ''}`}>{connected ? '已连接手机' : '未连接手机'}</span>
          </div>
        </div>

        <div className="vault-sidebar__utility">
          <button type="button" onClick={onOpenSettings}>
            <IconSettings size={15} /> 设置与同步
          </button>
          <button type="button" onClick={() => onSelect('trash')}>
            <IconTrash size={15} /> 回收站 {counts.trash > 0 ? `(${counts.trash})` : ''}
          </button>
          <button type="button" onClick={onLock}>
            <IconLock size={15} /> 锁定
          </button>
        </div>
        <p className="vault-sidebar__note">内容只保存在本地，或你指定的私有仓库。</p>
      </footer>
    </aside>
  );
};
