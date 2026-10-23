import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useVault} from './VaultProvider';
import {
  KINDS,
  allTags,
  countByKind,
  dayKey,
  entryTitle,
  filterEntries,
  formatDay,
  greeting,
  makeEntry,
  type Entry,
  type EntryFilter,
  type EntryKind,
} from './lib/model';
import {LockScreen} from './components/LockScreen';
import {Sidebar} from './components/Sidebar';
import {EntryList} from './components/EntryList';
import {EntryDetail} from './components/EntryDetail';
import {Composer} from './components/Composer';
import {Settings} from './components/Settings';
import {ShareLanding} from './components/ShareLanding';
import {ResearchHome} from './components/ResearchHome';
import {
  IconClock,
  IconClose,
  IconEdit,
  IconLock,
  IconMenu,
  IconPlus,
  IconSearch,
  IconSettings,
} from './components/Icons';

type View = EntryFilter['view'];

type ComposerState = {entry: Entry; isNew: boolean};

const isShareLanding = (): boolean =>
  new URLSearchParams(window.location.search).get('share') === '1';

const viewLabel = (view: View, kind: EntryKind | undefined, tag: string | undefined): string => {
  if (view === 'today') return '今天';
  if (view === 'all') return '全部记录';
  if (view === 'star') return '收藏';
  if (view === 'trash') return '回收站';
  if (view === 'kind' && kind) return KINDS[kind].label;
  if (view === 'tag' && tag) return `# ${tag}`;
  return '庭院';
};

export const VaultApp = () => {
  const vault = useVault();
  const {
    status,
    entries,
    settings,
    syncState,
    captureIntent,
    errors,
    lock,
    deleteEntry,
    restoreEntry,
    purgeEntry,
    emptyTrash,
    saveEntry,
    clearCaptureIntent,
    ensureAttachmentUrls,
  } = vault;

  const [view, setView] = useState<View>('today');
  const [kind, setKind] = useState<EntryKind | undefined>(undefined);
  const [tag, setTag] = useState<string | undefined>(undefined);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'updated' | 'created' | 'title'>('updated');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composer, setComposer] = useState<ComposerState | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [shareLanding, setShareLanding] = useState(isShareLanding);
  const searchRef = useRef<HTMLInputElement>(null);
  const composerIntentRef = useRef(0);

  useEffect(() => {
    if (status !== 'unlocked') return;
    const receive = () => {
      // Do not consume another share while a draft is being edited.
      if (composer) return;
      const raw = window.GardenNative?.takeShare();
      if (!raw) return;
      try {
        const shared = JSON.parse(raw) as {title?: string; text?: string};
        const entry = makeEntry('clip');
        entry.title = typeof shared.title === 'string' ? shared.title : '';
        entry.body = typeof shared.text === 'string' ? shared.text : '';
        entry.url = entry.body.match(/https?:\/\/[^\s<>]+/)?.[0] ?? '';
        setComposer({entry, isNew: true});
      } catch { vault.notify('无法读取分享内容', 'bad'); }
    };
    receive();
    window.addEventListener('garden-share', receive);
    return () => window.removeEventListener('garden-share', receive);
  }, [status, composer, vault]);

  useEffect(() => {
    const back = () => {
      if (status !== 'unlocked') window.GardenNative?.minimize();
      else if (composer) {
        document.querySelector<HTMLButtonElement>('.vault-composer__head-actions button')?.click();
      } else if (settingsOpen) setSettingsOpen(false);
      else if (drawerOpen) setDrawerOpen(false);
      else if (selectedId) setSelectedId(null);
      else window.GardenNative?.minimize();
    };
    window.addEventListener('garden-back', back);
    return () => window.removeEventListener('garden-back', back);
  }, [status, composer, settingsOpen, drawerOpen, selectedId]);

  const openNew = useCallback((nextKind: EntryKind = 'note') => {
    setComposer({entry: makeEntry(nextKind), isNew: true});
    setDrawerOpen(false);
  }, []);

  const activeEntries = useMemo(() => entries.filter((entry) => !entry.deletedAt), [entries]);
  const todayCount = useMemo(
    () => activeEntries.filter((entry) => dayKey(entry.updatedAt) === dayKey(Date.now())).length,
    [activeEntries],
  );
  const kindCounts = useMemo(() => countByKind(entries), [entries]);
  const tags = useMemo(() => allTags(activeEntries).slice(0, 18), [activeEntries]);
  const starredCount = useMemo(() => activeEntries.filter((entry) => entry.favorite).length, [activeEntries]);
  const trashCount = useMemo(() => entries.filter((entry) => entry.deletedAt).length, [entries]);

  const filter: EntryFilter = useMemo(
    () => ({view, kind, tag, query, sort}),
    [view, kind, tag, query, sort],
  );

  const visible = useMemo(() => {
    const base = filterEntries(entries, filter);
    if (view !== 'today') return base;
    const today = dayKey(Date.now());
    return base.filter((entry) => dayKey(entry.updatedAt) === today || dayKey(entry.createdAt) === today);
  }, [entries, filter, view]);

  const selected = useMemo(
    () => entries.find((entry) => entry.id === selectedId) ?? null,
    [entries, selectedId],
  );

  const syncLabel =
    syncState.status === 'syncing'
      ? '正在同步…'
      : syncState.status === 'error'
        ? '同步失败'
        : syncState.status === 'ok'
          ? '已同步'
          : syncState.status === 'idle'
            ? '已连接'
            : '仅本机';

  useEffect(() => {
    if (status !== 'unlocked') return;
    if (!captureIntent) return;
    if (composerIntentRef.current === captureIntent.nonce) return;
    composerIntentRef.current = captureIntent.nonce;
    setComposer({entry: makeEntry(captureIntent.kind ?? 'note'), isNew: true});
    clearCaptureIntent();
  }, [status, captureIntent, clearCaptureIntent]);

  useEffect(() => {
    if (!selected) return;
    ensureAttachmentUrls(selected.attachments.map((item) => item.id));
  }, [selected, ensureAttachmentUrls]);

  useEffect(() => {
    if (status !== 'unlocked') return;
    const onKey = (event: KeyboardEvent) => {
      const meta = event.metaKey || event.ctrlKey;
      if (meta && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      } else if (meta && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        openNew();
      } else if (event.key === 'Escape') {
        if (composer) setComposer(null);
        else if (settingsOpen) setSettingsOpen(false);
        else if (drawerOpen) setDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // openNew is stable enough for this listener; it only touches local setters
  }, [status, composer, settingsOpen, drawerOpen]);

  const selectView = useCallback((nextView: View, nextKind?: EntryKind, nextTag?: string) => {
    setView(nextView);
    setKind(nextKind);
    setTag(nextTag);
    setSettingsOpen(false);
    setDrawerOpen(false);
    setSelectedId(null);
    if (nextView === 'settings') {
      setSettingsOpen(true);
      setView('all');
    }
  }, []);

  const openEntry = useCallback((entry: Entry) => {
    setSelectedId(entry.id);
    setDrawerOpen(false);
  }, []);

  const handleSaved = useCallback((entry: Entry) => {
    setSelectedId(entry.id);
    setComposer(null);
    ensureAttachmentUrls(entry.attachments.map((item) => item.id));
  }, [ensureAttachmentUrls]);

  const handleDelete = useCallback(
    async (entry: Entry) => {
      if (!window.confirm(`把「${entryTitle(entry)}」移到回收站？`)) return;
      await deleteEntry(entry.id);
      setSelectedId(null);
    },
    [deleteEntry],
  );

  const handleRestore = useCallback(
    async (entry: Entry) => {
      await restoreEntry(entry.id);
      setView('all');
    },
    [restoreEntry],
  );

  const handlePurge = useCallback(
    async (entry: Entry) => {
      if (!window.confirm(`彻底删除「${entryTitle(entry)}」？这个操作无法撤销。`)) return;
      await purgeEntry(entry.id);
      setSelectedId(null);
    },
    [purgeEntry],
  );

  const handleEmptyTrash = useCallback(async () => {
    if (!window.confirm('清空回收站？所有内容将无法恢复。')) return;
    await emptyTrash();
    setSelectedId(null);
  }, [emptyTrash]);

  const toggleFlag = useCallback(
    async (entry: Entry, flag: 'pinned' | 'favorite') => {
      await saveEntry({...entry, [flag]: !entry[flag]});
    },
    [saveEntry],
  );

  if (status === 'loading') {
    return (
      <div className="vault-boot">
        <div className="vault-boot__seal">箱</div>
        <p>正在打开庭院…</p>
      </div>
    );
  }

  if (status !== 'unlocked') {
    return (
      <>
        <LockScreen />
        {shareLanding && (
          <div className="vault-share-hint">
            <span>分享的内容会在解锁后自动收进来。</span>
            <button type="button" onClick={() => setShareLanding(false)}>
              知道了
            </button>
          </div>
        )}
      </>
    );
  }

  if (shareLanding) {
    return <ShareLanding onEnter={() => setShareLanding(false)} />;
  }

  const compact = Boolean(selected) || settingsOpen;

  return (
    <div className={`vault-shell${drawerOpen ? ' is-drawer-open' : ''}${compact ? ' has-selection' : ''}`}>
      <Sidebar
        settings={settings}
        syncLabel={syncLabel}
        onCloseDrawer={() => setDrawerOpen(false)}
        onLock={lock}
        view={view}
        kind={kind}
        tag={tag}
        counts={{
          today: todayCount,
          all: activeEntries.length,
          starred: starredCount,
          trash: trashCount,
          kinds: kindCounts,
        }}
        tags={tags}
        onSelect={selectView}
        onOpenSettings={() => {
          setSettingsOpen(true);
          setDrawerOpen(false);
          setSelectedId(null);
        }}
        onNew={() => openNew('note')}
        onOpenRandom={() => {
          const pool = activeEntries;
          if (!pool.length) return;
          const pick = pool[Math.floor(Math.random() * pool.length)];
          if (pick) openEntry(pick);
        }}
      />
      {drawerOpen && <button type="button" className="vault-scrim" aria-label="关闭菜单" onClick={() => setDrawerOpen(false)} />}

      <main className="vault-main">
        <header className="vault-topbar">
          <button
            type="button"
            className="vault-iconbtn vault-burger"
            aria-label="打开菜单"
            onClick={() => setDrawerOpen(true)}
          >
            <IconMenu />
          </button>
          <div className="vault-search">
            <IconSearch size={17} />
            <input
              ref={searchRef}
              type="search"
              value={query}
              placeholder="搜索标题、正文、标签…"
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => {
                setQuery(event.target.value);
                  if (event.target.value) {
                    setSelectedId(null);
                    setView('all');
                    setKind(undefined);
                    setTag(undefined);
                  }
              }}
            />
            {query && (
              <button type="button" className="vault-search__clear" aria-label="清除搜索" onClick={() => setQuery('')}>
                <IconClose size={15} />
              </button>
            )}
          </div>
          <div className="vault-topbar__actions">
            <button
              type="button"
              className="vault-syncpill"
              title={`同步状态：${syncLabel}${syncState.at ? ` · ${formatDay(syncState.at)}` : ''}`}
              onClick={() => {
                setSettingsOpen(true);
                setSelectedId(null);
              }}
            >
              <span className={`vault-dot vault-dot--${syncState.status}`} />
              <span>{syncLabel}</span>
            </button>
            <button type="button" className="vault-btn vault-btn--primary" onClick={() => openNew('note')}>
              <IconPlus size={16} />
              <span>新建</span>
            </button>
            <button
              type="button"
              className="vault-iconbtn"
              aria-label="设置"
              title="设置"
              onClick={() => {
                setSettingsOpen(true);
                setSelectedId(null);
              }}
            >
              <IconSettings size={18} />
            </button>
            <button type="button" className="vault-iconbtn" aria-label="锁定" title="立即锁定" onClick={lock}>
              <IconLock size={18} />
            </button>
          </div>
        </header>

        {errors.length > 0 && (
          <div className="vault-errors" role="alert">
            <strong>{errors.length} 条错误</strong>
            <span>{errors[errors.length - 1]}</span>
          </div>
        )}

        <div className="vault-workspace">
          <section className="vault-listpane">
            {view === 'today' && !query && <ResearchHome entries={entries} onCreate={(entry) => setComposer({entry, isNew: true})} />}
            <EntryList
              title={viewLabel(view, kind, tag)}
              view={view}
              sort={sort}
              entries={visible}
              query={query}
              onSort={setSort}
              onOpen={openEntry}
              onEdit={(entry) => setComposer({entry, isNew: false})}
              onNew={() => openNew(kind ?? 'note')}
              onEmptyTrash={() => void handleEmptyTrash()}
            />
          </section>
          <section className="vault-detailpane">
            {selected ? (
              <EntryDetail
                entry={selected}
                onEdit={() => setComposer({entry: selected, isNew: false})}
                onDelete={() => void handleDelete(selected)}
                onRestore={() => void handleRestore(selected)}
                onPurge={() => void handlePurge(selected)}
                onTogglePin={() => void toggleFlag(selected, 'pinned')}
                onToggleFavorite={() => void toggleFlag(selected, 'favorite')}
                onOpenEntry={(entry) => setSelectedId(entry.id)}
                onBack={() => setSelectedId(null)}
              />
            ) : (
              <div className="vault-empty">
                <span className="vault-empty__seal">箱</span>
                <h2>选择一条记录</h2>
                <p>左侧是已经收进来的内容。也可以把此刻的想法先写下来。</p>
                <div className="vault-empty__actions">
                  <button type="button" className="vault-btn vault-btn--primary" onClick={() => openNew('note')}>
                    <IconPlus size={16} /> 新建便签
                  </button>
                  <button type="button" className="vault-btn" onClick={() => openNew('diary')}>
                    <IconEdit size={16} /> 写日记
                  </button>
                </div>
                <div className="vault-empty__hint">
                  {greeting()}。{new Date().getFullYear()} 年 {formatDay(Date.now()).slice(5)}，
                  {activeEntries.length === 0 ? '庭院还是空的。' : `这里已经收着 ${activeEntries.length} 条记录。`}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <nav className="vault-mobilebar" aria-label="快捷导航">
        <button
          type="button"
          className={view === 'today' && !settingsOpen ? 'is-active' : ''}
          onClick={() => selectView('today')}
        >
          <IconClock size={19} />
          <span>今天</span>
        </button>
        <button
          type="button"
          className={view === 'all' && !settingsOpen ? 'is-active' : ''}
          onClick={() => selectView('all')}
        >
          <IconMenu size={19} />
          <span>记录</span>
        </button>
        <button
          type="button"
          onClick={() => {
            selectView('all');
            setSelectedId(null);
            setSettingsOpen(false);
            window.requestAnimationFrame(() => searchRef.current?.focus());
          }}
        >
          <IconSearch size={19} />
          <span>搜索</span>
        </button>
        <button
          type="button"
          className={settingsOpen ? 'is-active' : ''}
          onClick={() => {
            setSettingsOpen(true);
            setSelectedId(null);
          }}
        >
          <IconSettings size={19} />
          <span>设置</span>
        </button>
      </nav>

      {settingsOpen && (
        <>
          <button type="button" className="vault-sheet-scrim" aria-label="关闭设置" onClick={() => setSettingsOpen(false)} />
          <Settings onClose={() => setSettingsOpen(false)} />
        </>
      )}

      {composer && (
        <Composer
          initial={composer.entry}
          isNew={composer.isNew}
          onClose={() => setComposer(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};
