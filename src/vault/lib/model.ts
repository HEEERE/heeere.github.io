import type {CipherText} from './crypto';

/* -------------------------------------------------------------------------- */
/* Entry model                                                                */
/* -------------------------------------------------------------------------- */

export const KIND_LIST = ['note', 'diary', 'idea', 'prompt', 'workflow', 'style', 'tech', 'clip'] as const;
export type EntryKind = (typeof KIND_LIST)[number];

export type KindMeta = {
  label: string;
  en: string;
  color: string;
  hint: string;
  template: string;
};

export const KINDS: Record<EntryKind, KindMeta> = {
  note: {
    label: '便签',
    en: 'NOTE',
    color: '#a9b0a6',
    hint: '随手记下的一句话',
    template: '',
  },
  diary: {
    label: '日记',
    en: 'DIARY',
    color: '#9bb7d8',
    hint: '今天发生了什么',
    template: '',
  },
  idea: {
    label: '灵感',
    en: 'IDEA',
    color: '#e3c07a',
    hint: '还没成形的一个念头',
    template: '',
  },
  prompt: {
    label: 'Prompt',
    en: 'PROMPT',
    color: '#c98f6b',
    hint: '值得反复使用的提示词',
    template: '## 用途\n\n\n## Prompt\n\n```text\n\n```\n\n## 备注\n\n',
  },
  workflow: {
    label: '工作流',
    en: 'FLOW',
    color: '#8fb8a0',
    hint: '一套可以复用的步骤',
    template: '## 触发\n\n\n## 步骤\n\n1. \n\n## 产出\n\n',
  },
  style: {
    label: 'Style',
    en: 'STYLE',
    color: '#b8a1d0',
    hint: '风格与审美的规范',
    template: '## 适用\n\n\n## 要点\n\n- \n\n## 示例\n\n',
  },
  tech: {
    label: '技术',
    en: 'NOTES',
    color: '#8aa7b8',
    hint: '读过的、做过的技术笔记',
    template: '## 背景\n\n\n## 要点\n\n\n## 参考\n\n',
  },
  clip: {
    label: '摘录',
    en: 'CLIP',
    color: '#d8a8a0',
    hint: '一个链接、一张图、一段摘抄',
    template: '## 摘录\n\n\n## 为什么收进来\n\n',
  },
};

export type AttachmentRef = {
  id: string;
  name: string;
  mime: string;
  size: number;
  width?: number;
  height?: number;
};

export type Entry = {
  id: string;
  kind: EntryKind;
  title: string;
  body: string;
  tags: string[];
  url: string;
  attachments: AttachmentRef[];
  pinned: boolean;
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
  /** present when the entry sits in the trash; still synced so deletion propagates */
  deletedAt?: number;
};

/** Encrypted entry envelope persisted in IndexedDB / sync snapshots. */
export type EntryRecord = {
  id: string;
  updatedAt: number;
  deletedAt?: number;
  iv: string;
  ct: string;
};

export type FileMeta = {
  id: string;
  name: string;
  mime: string;
  size: number;
  width?: number;
  height?: number;
  createdAt: number;
  iv: string;
};

export type FileRecord = FileMeta & {
  /** AES-GCM payload, stored as ArrayBuffer in IndexedDB and base64 in sync. */
  ct: ArrayBuffer | Uint8Array;
};

export type SyncConfig = {
  owner: string;
  repo: string;
  branch: string;
  path: string;
  token: string;
  enabled: boolean;
};

export type LocalSettings = {
  autoLockMinutes: number;
  dshPairUrl: string;
  dshUpdatedAt: number;
  sync: SyncConfig | null;
  deviceId: string;
  deviceName: string;
  lastSyncAt: number;
  remoteUpdatedAt: number;
};

export const DEFAULT_LOCAL_SETTINGS: LocalSettings = {
  autoLockMinutes: 15,
  dshPairUrl: '',
  dshUpdatedAt: 0,
  sync: null,
  deviceId: '',
  deviceName: '',
  lastSyncAt: 0,
  remoteUpdatedAt: 0,
};

export type VaultMeta = {
  key: 'meta';
  version: 1;
  salt: string;
  iterations: number;
  verifier: CipherText;
  createdAt: number;
  updatedAt: number;
};

/* -------------------------------------------------------------------------- */
/* Construction helpers                                                       */
/* -------------------------------------------------------------------------- */

const now = (): number => Date.now();

export const makeEntry = (kind: EntryKind, at = now()): Entry => ({
  id: crypto.randomUUID(),
  kind,
  title: '',
  body: KINDS[kind].template,
  tags: [],
  url: '',
  attachments: [],
  pinned: false,
  favorite: false,
  createdAt: at,
  updatedAt: at,
});

export const cloneEntry = (entry: Entry): Entry => ({
  ...entry,
  tags: [...entry.tags],
  attachments: entry.attachments.map((item) => ({...item})),
});

/* -------------------------------------------------------------------------- */
/* Text utilities                                                             */
/* -------------------------------------------------------------------------- */

export const normalizeTag = (raw: string): string =>
  raw
    .replace(/^#+/, '')
    .replace(/[,，;；]+/g, ' ')
    .trim()
    .slice(0, 24);

const CJK = /[\u3400-\u9fff\u3040-\u30ff\uac00-\ud7af]/u;
const LATIN_WORD = /[A-Za-z0-9]+(?:['’_-][A-Za-z0-9]+)*/g;

/** CJK characters count as words too — good enough for a note app. */
export const wordCount = (text: string): number => {
  if (!text.trim()) return 0;
  const cjk = (text.match(new RegExp(CJK, 'gu')) ?? []).length;
  const latin = (text.replace(new RegExp(CJK, 'gu'), ' ').match(LATIN_WORD) ?? []).length;
  return cjk + latin;
};

export const plainText = (markdown: string): string =>
  markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)]\([^)]*\)/g, '$1')
    .replace(/[#>*_~-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const entryTitle = (entry: Entry): string =>
  entry.title.trim() || plainText(entry.body).slice(0, 42) || KINDS[entry.kind].hint;

export const entrySnippet = (entry: Entry, query = '', max = 130): string => {
  const text = plainText(entry.body);
  if (!text) return entry.url || KINDS[entry.kind].hint;
  const needle = query.replace(/^#/, '').trim().toLowerCase();
  if (needle) {
    const index = text.toLowerCase().indexOf(needle);
    if (index > -1) {
      const start = Math.max(0, index - 40);
      return `${start > 0 ? '…' : ''}${text.slice(start, start + max)}`;
    }
  }
  return text.slice(0, max);
};

export const splitTags = (raw: string): string[] => {
  const tags = raw
    .split(/[\s,，;；#]+/)
    .map(normalizeTag)
    .filter(Boolean);
  return [...new Map(tags.map((tag) => [tag.toLowerCase(), tag])).values()].slice(0, 12);
};

export const toggleTag = (tags: string[], tag: string): string[] => {
  const needle = tag.toLowerCase();
  return tags.some((item) => item.toLowerCase() === needle)
    ? tags.filter((item) => item.toLowerCase() !== needle)
    : [...tags, tag].slice(0, 24);
};

export const allTags = (entries: Entry[]): {tag: string; count: number}[] => {
  const counts = new Map<string, {tag: string; count: number}>();
  for (const entry of entries) {
    for (const tag of entry.tags) {
      const key = tag.toLowerCase();
      const current = counts.get(key);
      if (current) current.count += 1;
      else counts.set(key, {tag, count: 1});
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
};

/* -------------------------------------------------------------------------- */
/* Filtering & search                                                         */
/* -------------------------------------------------------------------------- */

export type EntryFilter = {
  view: 'today' | 'all' | 'kind' | 'tag' | 'star' | 'trash' | 'settings';
  kind?: EntryKind;
  tag?: string;
  query?: string;
  sort?: 'updated' | 'created' | 'title';
};

const matchesQuery = (entry: Entry, query: string): boolean => {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) return true;
  const haystack = [entry.title, entry.body, entry.url, entry.tags.join(' '), KINDS[entry.kind].label]
    .join('\n')
    .toLowerCase();
  return tokens.every((token) =>
    token.startsWith('#')
      ? entry.tags.some((tag) => tag.toLowerCase() === token.slice(1))
      : haystack.includes(token),
  );
};

export const isVisible = (entry: Entry): boolean => !entry.deletedAt;

export const filterEntries = (entries: Entry[], filter: EntryFilter): Entry[] => {
  const active = entries.filter((entry) =>
    filter.view === 'trash' ? Boolean(entry.deletedAt) : !entry.deletedAt,
  );
  const filtered = active.filter((entry) => {
    if (filter.view === 'kind' && filter.kind && entry.kind !== filter.kind) return false;
    if (filter.view === 'star' && !entry.favorite) return false;
    if (filter.view === 'tag' && filter.tag) {
      if (!entry.tags.some((tag) => tag.toLowerCase() === filter.tag?.toLowerCase())) return false;
    }
    if (filter.query && !matchesQuery(entry, filter.query)) return false;
    return true;
  });
  const sort = filter.sort ?? 'updated';
  return filtered.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (sort === 'created') return b.createdAt - a.createdAt;
    if (sort === 'title') return entryTitle(a).localeCompare(entryTitle(b), 'zh-Hans');
    return b.updatedAt - a.updatedAt;
  });
};

export const countByKind = (entries: Entry[]): Record<EntryKind, number> => {
  const counts = Object.fromEntries(KIND_LIST.map((kind) => [kind, 0])) as Record<EntryKind, number>;
  for (const entry of entries) if (!entry.deletedAt) counts[entry.kind] += 1;
  return counts;
};

export const onThisDay = (entries: Entry[], reference = new Date()): Entry[] => {
  const month = reference.getMonth();
  const date = reference.getDate();
  return entries
    .filter((entry) => !entry.deletedAt && entry.createdAt < Date.now() - 86_400_000)
    .filter((entry) => {
      const created = new Date(entry.createdAt);
      return created.getMonth() === month && created.getDate() === date;
    })
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 3);
};

export const randomEntry = (entries: Entry[], kinds?: EntryKind[]): Entry | null => {
  const pool = entries.filter(
    (entry) => !entry.deletedAt && (!kinds || kinds.includes(entry.kind)),
  );
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
};

/* -------------------------------------------------------------------------- */
/* Dates                                                                      */
/* -------------------------------------------------------------------------- */

const pad = (value: number): string => String(value).padStart(2, '0');

export const formatDay = (timestamp: number): string => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
};

export const formatDayShort = (timestamp: number): string => {
  const date = new Date(timestamp);
  return `${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
};

export const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const formatDateTime = (timestamp: number): string =>
  timestamp ? `${formatDay(timestamp)} ${formatTime(timestamp)}` : '还没有同步过';

export const dayKey = (timestamp: number): string => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const relativeDay = (timestamp: number): string => {
  const date = new Date(timestamp);
  const today = new Date();
  const diff = Math.round(
    (new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() -
      new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()) /
      86_400_000,
  );
  if (diff === 0) return '今天';
  if (diff === 1) return '昨天';
  if (diff < 7) return `${diff} 天前`;
  if (diff < 365) return `${Math.floor(diff / 30)} 个月前`;
  return `${Math.floor(diff / 365)} 年前`;
};

export const greeting = (date = new Date()): string => {
  const hour = date.getHours();
  if (hour < 5) return '夜还很长';
  if (hour < 9) return '早上好';
  if (hour < 12) return '上午好';
  if (hour < 14) return '午后好';
  if (hour < 18) return '下午好';
  if (hour < 22) return '晚上好';
  return '夜深了';
};

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

/* -------------------------------------------------------------------------- */
/* Merge (cross-device sync)                                                  */
/* -------------------------------------------------------------------------- */

export const mergeEntryRecords = (local: EntryRecord[], remote: EntryRecord[]): EntryRecord[] => {
  const map = new Map<string, EntryRecord>();
  for (const record of local) map.set(record.id, record);
  for (const record of remote) {
    const current = map.get(record.id);
    if (!current) {
      map.set(record.id, record);
      continue;
    }
    if (record.updatedAt > current.updatedAt) map.set(record.id, record);
  }
  return [...map.values()];
};

export const mergeFileRecords = (local: FileRecord[], remote: FileRecord[]): FileRecord[] => {
  const map = new Map<string, FileRecord>();
  for (const record of local) map.set(record.id, record);
  for (const record of remote) if (!map.has(record.id)) map.set(record.id, record);
  return [...map.values()];
};

export const entriesFromRecords = (records: EntryRecord[]): EntryRecord[] =>
  records.filter((record) => !record.deletedAt);

export const trashCount = (records: EntryRecord[]): number => records.filter((record) => record.deletedAt).length;
