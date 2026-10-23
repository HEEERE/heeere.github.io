import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  checkVerifier,
  createSalt,
  decryptBuffer,
  decryptJson,
  deriveKey,
  encryptBuffer,
  encryptJson,
  fromBase64,
  KDF_ITERATIONS,
  makeVerifier,
  MIN_PASSPHRASE_LENGTH,
  randomId,
  toBase64,
  type CipherText,
} from './lib/crypto';
import {
  destroyVaultDb,
  idbClear,
  idbDelete,
  idbDeleteMany,
  idbGet,
  idbGetAll,
  idbPut,
  idbPutAll,
} from './lib/idb';
import {
  DEFAULT_LOCAL_SETTINGS,
  KIND_LIST,
  KINDS,
  isVisible,
  makeEntry,
  mergeEntryRecords,
  type Entry,
  type EntryKind,
  type EntryRecord,
  type FileMeta,
  type FileRecord,
  type LocalSettings,
  type SyncConfig,
  type VaultMeta,
} from './lib/model';
import {
  buildEnvelope,
  mergeRemote,
  normalizeConfig,
  openEnvelope,
  readRemoteSnapshot,
  testConnection,
  writeRemoteSnapshot,
} from './lib/sync';
import {downloadText} from './lib/download';
import {base64ToBlob, prepareFile} from './lib/files';

const SHARE_CACHE = 'hakoniwa-vault-share';
const SHARE_URL = '/vault/__share';
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const TRASH_RETENTION_DAYS = 30;

export type SyncStatus = 'off' | 'idle' | 'syncing' | 'ok' | 'error';

export type SyncState = {
  status: SyncStatus;
  message: string;
  at: number;
};

export type CaptureIntent = {
  compose: boolean;
  kind?: EntryKind;
  nonce: number;
};

export type VaultContextValue = {
  status: 'loading' | 'empty' | 'locked' | 'unlocked';
  meta: VaultMeta | null;
  entries: Entry[];
  fileMeta: FileMeta[];
  settings: LocalSettings;
  syncState: SyncState;
  attachmentUrls: Record<string, string>;
  captureIntent: CaptureIntent | null;
  errors: string[];
  createVault: (passphrase: string) => Promise<void>;
  unlock: (passphrase: string) => Promise<void>;
  lock: () => void;
  resetDevice: () => Promise<void>;
  createEntry: (kind: EntryKind) => Promise<Entry | null>;
  saveEntry: (entry: Entry) => Promise<Entry>;
  deleteEntry: (id: string) => Promise<void>;
  restoreEntry: (id: string) => Promise<void>;
  purgeEntry: (id: string) => Promise<void>;
  emptyTrash: () => Promise<void>;
  addAttachments: (files: File[]) => Promise<{id: string; name: string; mime: string; size: number; width?: number; height?: number}[]>;
  ensureAttachmentUrls: (ids: string[]) => void;
  removeAttachment: (entryId: string, attachmentId: string) => Promise<void>;
  updateSettings: (patch: Partial<LocalSettings>) => Promise<void>;
  connectSync: (config: SyncConfig) => Promise<void>;
  disconnectSync: () => Promise<void>;
  syncNow: () => Promise<void>;
  changePassphrase: (current: string, next: string) => Promise<void>;
  exportEncryptedBackup: () => Promise<void>;
  exportMarkdown: () => Promise<void>;
  importEncryptedBackup: (file: File, passphrase: string) => Promise<void>;
  restoreFromSync: (passphrase: string, config: SyncConfig) => Promise<void>;
  clearCaptureIntent: () => void;
  notify: (message: string, tone?: 'info' | 'good' | 'bad') => void;
};

const VaultContext = createContext<VaultContextValue | null>(null);

export const useVault = (): VaultContextValue => {
  const value = useContext(VaultContext);
  if (!value) throw new Error('useVault must be used inside <VaultProvider>');
  return value;
};

type Toast = {id: number; message: string; tone: 'info' | 'good' | 'bad'};

type LocalRecord = CipherText & {key: 'settings'};
type FilePayload = {id: string; ct: ArrayBuffer};

const isEntryKind = (value: string | null): value is EntryKind =>
  Boolean(value && (KIND_LIST as readonly string[]).includes(value));

const fileMetaOf = (file: FileRecord): FileMeta => ({
  id: file.id,
  name: file.name,
  mime: file.mime,
  size: file.size,
  width: file.width,
  height: file.height,
  createdAt: file.createdAt,
  iv: file.iv,
});

const parseDshParam = (raw: string | null): string | null => {
  if (!raw) return null;
  let candidate = raw;
  try {
    candidate = decodeURIComponent(raw);
  } catch {
    /* keep raw */
  }
  if (/^https?:\/\//i.test(candidate)) return candidate;
  try {
    const normalized = candidate.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const text = new TextDecoder().decode(fromBase64(padded));
    return /^https?:\/\//i.test(text) ? text : null;
  } catch {
    return null;
  }
};

const parseIntent = (): CaptureIntent | null => {
  const params = new URLSearchParams(window.location.search);
  const wanted = params.get('type');
  const compose = params.get('new') === '1' || Boolean(wanted);
  if (!compose) return null;
  return {compose: true, kind: isEntryKind(wanted) ? wanted : undefined, nonce: Date.now()};
};

const stripQueryKeys = (...keys: string[]): void => {
  const url = new URL(window.location.href);
  for (const key of keys) url.searchParams.delete(key);
  const query = url.searchParams.toString();
  window.history.replaceState({}, '', `${url.pathname}${query ? `?${query}` : ''}`);
};

const makeLocalRecord = async (key: CryptoKey, settings: LocalSettings): Promise<LocalRecord> => {
  const cipher = await encryptJson(key, settings);
  return {key: 'settings', ...cipher};
};

const emptyLocalSettings = (): LocalSettings => ({
  ...DEFAULT_LOCAL_SETTINGS,
  deviceId: crypto.randomUUID(),
  deviceName: /iPhone|iPad|Android/i.test(navigator.userAgent) ? '手机' : '电脑',
});

const unique = <T,>(items: T[]): T[] => [...new Set(items)];

export const VaultProvider = ({children}: {children: ReactNode}) => {
  const [status, setStatus] = useState<'loading' | 'empty' | 'locked' | 'unlocked'>('loading');
  const [meta, setMeta] = useState<VaultMeta | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [fileMeta, setFileMeta] = useState<FileMeta[]>([]);
  const [settings, setSettings] = useState<LocalSettings>(() => emptyLocalSettings());
  const [syncState, setSyncState] = useState<SyncState>({status: 'off', message: '', at: 0});
  const [attachmentUrls, setAttachmentUrls] = useState<Record<string, string>>({});
  const [captureIntent, setCaptureIntent] = useState<CaptureIntent | null>(() => parseIntent());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const keyRef = useRef<CryptoKey | null>(null);
  const metaRef = useRef<VaultMeta | null>(null);
  const recordsRef = useRef<EntryRecord[]>([]);
  const fileMetaRef = useRef<FileMeta[]>([]);
  const settingsRef = useRef<LocalSettings>(settings);
  const statusRef = useRef(status);
  const toastCounter = useRef(0);
  const urlCacheRef = useRef<Map<string, string>>(new Map());
  const syncBusyRef = useRef(false);
  const syncTimerRef = useRef<number | null>(null);
  const pollRef = useRef<number | null>(null);
  const dshPendingRef = useRef<string | null>(null);
  const bootedRef = useRef(false);
  const shareHandledRef = useRef(false);
  const syncRef = useRef<(reason: string) => Promise<void>>(async () => undefined);

  statusRef.current = status;
  settingsRef.current = settings;

  const notify = useCallback((message: string, tone: 'info' | 'good' | 'bad' = 'info') => {
    toastCounter.current += 1;
    const id = toastCounter.current;
    setToasts((current) => [...current.slice(-2), {id, message, tone}]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 2400);
  }, []);

  const noteError = useCallback((message: string) => {
    setErrors((current) => unique([message, ...current]).slice(0, 6));
  }, []);

  const persistSettings = useCallback(
    async (next: LocalSettings) => {
      settingsRef.current = next;
      setSettings(next);
      const key = keyRef.current;
      if (key) {
        await idbPut('local', await makeLocalRecord(key, next)).catch((error: unknown) =>
          noteError(String(error)),
        );
      }
    },
    [noteError],
  );

  const saveSettingsQuiet = useCallback(async (next: LocalSettings) => {
    settingsRef.current = next;
    setSettings(next);
    const key = keyRef.current;
    if (key) await idbPut('local', await makeLocalRecord(key, next));
  }, []);

  const decryptRecord = useCallback(async (key: CryptoKey, record: EntryRecord): Promise<Entry | null> => {
    try {
      return await decryptJson<Entry>(key, {iv: record.iv, ct: record.ct});
    } catch {
      return null;
    }
  }, []);

  const hydrate = useCallback(
    async (key: CryptoKey, currentMeta: VaultMeta): Promise<LocalSettings> => {
      const rawRecords = await idbGetAll<EntryRecord>('entries');
      const cutoff = Date.now() - TRASH_RETENTION_DAYS * 86_400_000;
      const expired = rawRecords.filter((record) => record.deletedAt && record.deletedAt < cutoff);
      if (expired.length) {
        await idbDeleteMany(
          'entries',
          expired.map((record) => record.id),
        );
      }
      const records = rawRecords.filter((record) => !expired.includes(record));
      const decrypted = await Promise.all(records.map((record) => decryptRecord(key, record)));
      const nextEntries = decrypted
        .filter((entry): entry is Entry => Boolean(entry))
        .sort((a, b) => b.updatedAt - a.updatedAt);
      const metas = await idbGetAll<FileMeta>('filemeta');

      recordsRef.current = records;
      fileMetaRef.current = metas;
      setEntries(nextEntries);
      setFileMeta(metas);
      metaRef.current = currentMeta;
      setMeta(currentMeta);

      const localRecord = await idbGet<LocalRecord>('local', 'settings');
      if (localRecord) {
        try {
          const stored = await decryptJson<LocalSettings>(key, localRecord);
          const merged = {...emptyLocalSettings(), ...stored};
          settingsRef.current = merged;
          setSettings(merged);
          return merged;
        } catch {
          const fallback = emptyLocalSettings();
          settingsRef.current = fallback;
          setSettings(fallback);
          return fallback;
        }
      }
      const fallback = emptyLocalSettings();
      await idbPut('local', await makeLocalRecord(key, fallback));
      settingsRef.current = fallback;
      setSettings(fallback);
      return fallback;
    },
    [decryptRecord],
  );

  const readAllFileRecords = useCallback(async (metas: FileMeta[]): Promise<FileRecord[]> => {
    const records: FileRecord[] = [];
    for (const item of metas) {
      const payload = await idbGet<FilePayload>('files', item.id);
      if (!payload) continue;
      records.push({...item, ct: payload.ct});
    }
    return records;
  }, []);

  const decryptFileUrl = useCallback(
    async (id: string): Promise<string | undefined> => {
      const cached = urlCacheRef.current.get(id);
      if (cached) return cached;
      const key = keyRef.current;
      const item = fileMetaRef.current.find((metaItem) => metaItem.id === id);
      if (!key || !item) return undefined;
      try {
        const payload = await idbGet<FilePayload>('files', id);
        if (!payload) return undefined;
        const plain = await decryptBuffer(key, item.iv, payload.ct);
        const url = URL.createObjectURL(new Blob([plain], {type: item.mime || 'application/octet-stream'}));
        urlCacheRef.current.set(id, url);
        setAttachmentUrls((current) => ({...current, [id]: url}));
        return url;
      } catch {
        noteError('有附件无法解密，可能来自已更换口令的设备');
        return undefined;
      }
    },
    [noteError],
  );

  const ensureAttachmentUrls = useCallback(
    (ids: string[]) => {
      for (const id of ids) {
        if (!urlCacheRef.current.has(id)) void decryptFileUrl(id);
      }
    },
    [decryptFileUrl],
  );

  const revokeAttachmentUrls = useCallback(() => {
    for (const url of urlCacheRef.current.values()) URL.revokeObjectURL(url);
    urlCacheRef.current.clear();
    setAttachmentUrls({});
  }, []);

  const scheduleSync = useCallback((delay = 3500) => {
    if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
    syncTimerRef.current = window.setTimeout(() => {
      syncTimerRef.current = null;
      if (settingsRef.current.sync?.enabled) void syncRef.current('auto');
    }, delay);
  }, []);

  const applyMerged = useCallback(
    async (records: EntryRecord[], files: FileRecord[]): Promise<void> => {
      const key = keyRef.current;
      if (!key) return;
      const decrypted = await Promise.all(records.map((record) => decryptRecord(key, record)));
      const nextEntries = decrypted
        .filter((entry): entry is Entry => Boolean(entry))
        .sort((a, b) => b.updatedAt - a.updatedAt);
      const nextMeta = files.map(fileMetaOf);
      const existing = new Set(fileMetaRef.current.map((item) => item.id));
      const newBytes = files.filter((file) => !existing.has(file.id));
      await idbPutAll('entries', records);
      await idbPutAll('filemeta', nextMeta);
      await idbPutAll(
        'files',
        newBytes.map((file) => ({id: file.id, ct: file.ct as ArrayBuffer})),
      );
      recordsRef.current = records;
      fileMetaRef.current = nextMeta;
      setEntries(nextEntries);
      setFileMeta(nextMeta);
    },
    [decryptRecord],
  );

  const performSync = useCallback(
    async (reason: string): Promise<void> => {
      const key = keyRef.current;
      const currentMeta = metaRef.current;
      const currentSettings = settingsRef.current;
      const config = currentSettings.sync;
      if (!key || !currentMeta || !config?.enabled || statusRef.current !== 'unlocked') {
        setSyncState({status: 'off', message: '', at: Date.now()});
        return;
      }
      if (syncBusyRef.current) {
        scheduleSync(4000);
        return;
      }
      syncBusyRef.current = true;
      setSyncState({
        status: 'syncing',
        message: reason === 'poll' ? '检查远端更新…' : '同步中…',
        at: Date.now(),
      });
      try {
        const normalized = normalizeConfig(config);
        let remote = await readRemoteSnapshot(normalized);
        let records = recordsRef.current;
        let files = await readAllFileRecords(fileMetaRef.current);
        let shouldPush = !remote;
        let remoteUpdatedAt = currentSettings.remoteUpdatedAt;

        if (remote) {
          if (remote.envelope.salt !== currentMeta.salt) {
            throw new Error('远端同步文件来自不同的口令。请用最新口令重新恢复，或先在原设备重新上传。');
          }
          const payload = await openEnvelope(key, remote.envelope);
          const merged = mergeRemote(records, files, payload);
          remoteUpdatedAt = Math.max(remoteUpdatedAt, remote.envelope.updatedAt);
          if (merged.localChanged) await applyMerged(merged.entries, merged.files);
          records = merged.entries;
          files = merged.files;
          shouldPush = merged.remoteChanged;
        }

        if (shouldPush) {
          const envelope = await buildEnvelope(key, currentMeta.salt, currentMeta.iterations, records, files);
          const sha = remote?.sha ?? null;
          try {
            await writeRemoteSnapshot(normalized, envelope, sha, `vault: sync ${new Date().toISOString()}`);
          } catch (error) {
            remote = await readRemoteSnapshot(normalized).catch(() => null);
            if (!remote) throw error;
            const payload = await openEnvelope(key, remote.envelope);
            const retry = mergeRemote(records, files, payload);
            const retryEnvelope = await buildEnvelope(
              key,
              currentMeta.salt,
              currentMeta.iterations,
              retry.entries,
              retry.files,
            );
            await writeRemoteSnapshot(normalized, retryEnvelope, remote.sha, 'vault: sync (retry)');
            await applyMerged(retry.entries, retry.files);
            remoteUpdatedAt = Math.max(remoteUpdatedAt, retryEnvelope.updatedAt);
          }
          remoteUpdatedAt = Math.max(remoteUpdatedAt, envelope.updatedAt);
        }

        const nextSettings = {...currentSettings, lastSyncAt: Date.now(), remoteUpdatedAt};
        await saveSettingsQuiet(nextSettings);
        setSyncState({status: 'ok', message: shouldPush ? '已同步到 GitHub' : '已是最新', at: Date.now()});
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setSyncState({status: 'error', message, at: Date.now()});
        noteError(message);
        if (reason === 'connect') throw error;
      } finally {
        syncBusyRef.current = false;
      }
    },
    [applyMerged, noteError, readAllFileRecords, saveSettingsQuiet, scheduleSync],
  );

  syncRef.current = performSync;

  const processPendingExtras = useCallback(
    async (key: CryptoKey, currentSettings: LocalSettings): Promise<LocalSettings> => {
      let next = currentSettings;
      const pendingDsh = dshPendingRef.current;
      if (pendingDsh) {
        next = {...next, dshPairUrl: pendingDsh, dshUpdatedAt: Date.now()};
        dshPendingRef.current = null;
        await idbPut('local', await makeLocalRecord(key, next));
        stripQueryKeys('dsh');
        notify('已保存 DSH 手机连接', 'good');
      }
      return next;
    },
    [notify],
  );

  const finishUnlock = useCallback(
    async (key: CryptoKey, currentMeta: VaultMeta) => {
      keyRef.current = key;
      const loaded = await hydrate(key, currentMeta);
      const next = await processPendingExtras(key, loaded);
      settingsRef.current = next;
      setSettings(next);
      setStatus('unlocked');
      setSyncState(
        next.sync?.enabled
          ? {status: 'idle', message: '已连接，等待同步', at: 0}
          : {status: 'off', message: '', at: 0},
      );
      if (next.sync?.enabled) scheduleSync(1200);
    },
    [hydrate, processPendingExtras, scheduleSync],
  );

  const boot = useCallback(async () => {
    try {
      const storedMeta = await idbGet<VaultMeta>('meta', 'meta');
      metaRef.current = storedMeta ?? null;
      setMeta(storedMeta ?? null);
      setStatus(storedMeta ? 'locked' : 'empty');
    } catch (error) {
      noteError(`本地存储不可用：${error instanceof Error ? error.message : String(error)}`);
      setStatus('empty');
    }
  }, [noteError]);

  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    dshPendingRef.current = parseDshParam(new URLSearchParams(window.location.search).get('dsh'));
    void boot();
  }, [boot]);

  const createVault = useCallback(
    async (passphrase: string) => {
      if (passphrase.length < MIN_PASSPHRASE_LENGTH) throw new Error(`口令至少 ${MIN_PASSPHRASE_LENGTH} 个字符`);
      const salt = createSalt();
      const key = await deriveKey(passphrase, salt, KDF_ITERATIONS);
      const verifier = await makeVerifier(key);
      const created = Date.now();
      const nextMeta: VaultMeta = {
        key: 'meta',
        version: 1,
        salt,
        iterations: KDF_ITERATIONS,
        verifier,
        createdAt: created,
        updatedAt: created,
      };
      await idbPut('meta', nextMeta);
      metaRef.current = nextMeta;
      setMeta(nextMeta);
      const initial = emptyLocalSettings();
      await idbPut('local', await makeLocalRecord(key, initial));
      await finishUnlock(key, nextMeta);
      notify('庭院已经建好，这是你的第一把钥匙。', 'good');
    },
    [finishUnlock, notify],
  );

  const unlock = useCallback(
    async (passphrase: string) => {
      const currentMeta = metaRef.current;
      if (!currentMeta) throw new Error('本机还没有庭院，先创建一个');
      const key = await deriveKey(passphrase, currentMeta.salt, currentMeta.iterations);
      const valid = await checkVerifier(key, currentMeta.verifier);
      if (!valid) throw new Error('口令不正确');
      await finishUnlock(key, currentMeta);
    },
    [finishUnlock],
  );

  const lock = useCallback(() => {
    keyRef.current = null;
    setStatus('locked');
    setEntries([]);
    setFileMeta([]);
    recordsRef.current = [];
    fileMetaRef.current = [];
    revokeAttachmentUrls();
    if (syncTimerRef.current) {
      window.clearTimeout(syncTimerRef.current);
      syncTimerRef.current = null;
    }
    setSyncState({status: settingsRef.current.sync?.enabled ? 'idle' : 'off', message: '', at: 0});
  }, [revokeAttachmentUrls]);

  useEffect(() => {
    const backgroundLock = () => { if (status === 'unlocked') lock(); };
    window.addEventListener('garden-lock', backgroundLock);
    return () => window.removeEventListener('garden-lock', backgroundLock);
  }, [status, lock]);

  const resetDevice = useCallback(async () => {
    lock();
    await destroyVaultDb();
    metaRef.current = null;
    recordsRef.current = [];
    fileMetaRef.current = [];
    setMeta(null);
    setEntries([]);
    setFileMeta([]);
    setStatus('empty');
    setSettings(emptyLocalSettings());
  }, [lock]);

  const persistEntryRecord = useCallback(
    async (entry: Entry): Promise<void> => {
      const key = keyRef.current;
      if (!key) throw new Error('庭院已锁定');
      const cipher = await encryptJson(key, entry);
      const record: EntryRecord = {
        id: entry.id,
        updatedAt: entry.updatedAt,
        deletedAt: entry.deletedAt,
        iv: cipher.iv,
        ct: cipher.ct,
      };
      await idbPut('entries', record);
      recordsRef.current = mergeEntryRecords(recordsRef.current, [record]);
      setEntries((current) => {
        const next = current.filter((item) => item.id !== entry.id);
        next.push(entry);
        return next.sort((a, b) => b.updatedAt - a.updatedAt);
      });
      if (settingsRef.current.sync?.enabled) scheduleSync();
    },
    [scheduleSync],
  );

  const saveEntry = useCallback(
    async (draft: Entry): Promise<Entry> => {
      const next: Entry = {
        ...draft,
        tags: [...new Set(draft.tags.map((tag) => tag.trim()).filter(Boolean))],
        updatedAt: Date.now(),
      };
      await persistEntryRecord(next);
      return next;
    },
    [persistEntryRecord],
  );

  const createEntry = useCallback(
    async (kind: EntryKind): Promise<Entry | null> => {
      const key = keyRef.current;
      if (!key) return null;
      const entry = makeEntry(kind);
      await persistEntryRecord(entry);
      return entry;
    },
    [persistEntryRecord],
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      const entry = entries.find((item) => item.id === id);
      if (!entry) return;
      const next: Entry = {...entry, deletedAt: Date.now(), updatedAt: Date.now()};
      await persistEntryRecord(next);
      notify('已放进回收站，30 天后自动清理');
    },
    [entries, notify, persistEntryRecord],
  );

  const restoreEntry = useCallback(
    async (id: string) => {
      const entry = entries.find((item) => item.id === id);
      if (!entry) return;
      const next: Entry = {...entry, deletedAt: undefined, updatedAt: Date.now()};
      await persistEntryRecord(next);
      notify('已恢复', 'good');
    },
    [entries, notify, persistEntryRecord],
  );

  const cleanupOrphanFiles = useCallback(async (remaining: Entry[]) => {
    const used = new Set(remaining.flatMap((entry) => entry.attachments.map((item) => item.id)));
    const orphans = fileMetaRef.current.filter((item) => !used.has(item.id)).map((item) => item.id);
    if (!orphans.length) return;
    await idbDeleteMany('filemeta', orphans);
    await idbDeleteMany('files', orphans);
    fileMetaRef.current = fileMetaRef.current.filter((item) => !orphans.includes(item.id));
    setFileMeta((current) => current.filter((item) => !orphans.includes(item.id)));
  }, []);

  const purgeEntry = useCallback(
    async (id: string) => {
      await idbDelete('entries', id);
      recordsRef.current = recordsRef.current.filter((record) => record.id !== id);
      const remaining = entries.filter((entry) => entry.id !== id);
      setEntries(remaining);
      await cleanupOrphanFiles(remaining);
      if (settingsRef.current.sync?.enabled) scheduleSync();
    },
    [cleanupOrphanFiles, entries, scheduleSync],
  );

  const emptyTrash = useCallback(async () => {
    const trashed = entries.filter((entry) => entry.deletedAt);
    if (!trashed.length) return;
    await idbDeleteMany(
      'entries',
      trashed.map((entry) => entry.id),
    );
    recordsRef.current = recordsRef.current.filter((record) => !trashed.some((entry) => entry.id === record.id));
    const remaining = entries.filter((entry) => !entry.deletedAt);
    setEntries(remaining);
    await cleanupOrphanFiles(remaining);
    notify('回收站已清空');
    if (settingsRef.current.sync?.enabled) scheduleSync();
  }, [cleanupOrphanFiles, entries, notify, scheduleSync]);

  const storeAttachment = useCallback(
    async (
      buffer: ArrayBuffer,
      original: {name: string; mime: string; width?: number; height?: number},
    ): Promise<FileMeta | null> => {
      const key = keyRef.current;
      if (!key) return null;
      if (buffer.byteLength > MAX_FILE_BYTES) {
        noteError(`附件「${original.name}」超过 25MB，未保存`);
        return null;
      }
      const encrypted = await encryptBuffer(key, buffer);
      const fileId = randomId(10);
      const item: FileMeta = {
        id: fileId,
        name: original.name,
        mime: original.mime,
        size: buffer.byteLength,
        width: original.width,
        height: original.height,
        createdAt: Date.now(),
        iv: encrypted.iv,
      };
      await idbPut('files', {id: fileId, ct: encrypted.data.buffer as ArrayBuffer});
      await idbPut('filemeta', item);
      fileMetaRef.current = [item, ...fileMetaRef.current];
      setFileMeta((current) => [item, ...current]);
      return item;
    },
    [noteError],
  );

  const addAttachments = useCallback(
    async (picked: File[]) => {
      const added: FileMeta[] = [];
      for (const file of picked) {
        if (file.size > MAX_FILE_BYTES) {
          noteError(`附件「${file.name}」超过 25MB，已跳过`);
          continue;
        }
        const prepared = await prepareFile(file);
        const stored = await storeAttachment(prepared.buffer, {
          name: prepared.name,
          mime: prepared.mime,
          width: prepared.width,
          height: prepared.height,
        });
        if (stored) added.push(stored);
      }
      return added.map((item) => ({
        id: item.id,
        name: item.name,
        mime: item.mime,
        size: item.size,
        width: item.width,
        height: item.height,
      }));
    },
    [noteError, storeAttachment],
  );

  const removeAttachment = useCallback(
    async (entryId: string, attachmentId: string) => {
      const entry = entries.find((item) => item.id === entryId);
      if (!entry) return;
      const next = {
        ...entry,
        attachments: entry.attachments.filter((item) => item.id !== attachmentId),
        updatedAt: Date.now(),
      };
      await persistEntryRecord(next);
      const referencedElsewhere = entries.some(
        (item) => item.id !== entryId && item.attachments.some((att) => att.id === attachmentId),
      );
      if (!referencedElsewhere) {
        await idbDelete('filemeta', attachmentId);
        await idbDelete('files', attachmentId);
        fileMetaRef.current = fileMetaRef.current.filter((item) => item.id !== attachmentId);
        setFileMeta((current) => current.filter((item) => item.id !== attachmentId));
      }
    },
    [entries, persistEntryRecord],
  );

  const updateSettings = useCallback(
    async (patch: Partial<LocalSettings>) => {
      const next = {...settingsRef.current, ...patch};
      await persistSettings(next);
      if (patch.sync) {
        setSyncState(
          next.sync?.enabled
            ? {status: 'idle', message: '已连接，等待同步', at: 0}
            : {status: 'off', message: '', at: 0},
        );
        if (next.sync?.enabled) scheduleSync(600);
      }
    },
    [persistSettings, scheduleSync],
  );

  const connectSync = useCallback(
    async (config: SyncConfig) => {
      const normalized = normalizeConfig(config);
      if (!normalized.owner || !normalized.repo || !normalized.token) throw new Error('仓库与令牌不能为空');
      const connection = await testConnection(normalized);
      if (!connection.ok) throw new Error(connection.message);
      await updateSettings({sync: {...normalized, enabled: true}});
      await performSync('connect');
    },
    [performSync, updateSettings],
  );

  const disconnectSync = useCallback(async () => {
    await updateSettings({sync: null});
    setSyncState({status: 'off', message: '', at: 0});
    notify('已断开同步；本机内容仍然保留');
  }, [notify, updateSettings]);

  const syncNow = useCallback(async () => {
    await performSync('manual');
  }, [performSync]);

  const changePassphrase = useCallback(
    async (currentPass: string, nextPass: string) => {
      const currentMeta = metaRef.current;
      const key = keyRef.current;
      if (!currentMeta || !key) throw new Error('庭院已锁定');
      if (nextPass.length < MIN_PASSPHRASE_LENGTH) throw new Error(`新口令至少 ${MIN_PASSPHRASE_LENGTH} 个字符`);
      const currentKey = await deriveKey(currentPass, currentMeta.salt, currentMeta.iterations);
      if (!(await checkVerifier(currentKey, currentMeta.verifier))) throw new Error('当前口令不正确');
      const salt = createSalt();
      const nextKey = await deriveKey(nextPass, salt, currentMeta.iterations);
      const verifier = await makeVerifier(nextKey);
      const nextMeta: VaultMeta = {...currentMeta, salt, verifier, updatedAt: Date.now()};
      const reEncryptedEntries: EntryRecord[] = [];
      for (const entry of entries) {
        const cipher = await encryptJson(nextKey, entry);
        reEncryptedEntries.push({
          id: entry.id,
          updatedAt: entry.updatedAt,
          deletedAt: entry.deletedAt,
          iv: cipher.iv,
          ct: cipher.ct,
        });
      }
      const files = await readAllFileRecords(fileMetaRef.current);
      const nextFiles: FileRecord[] = [];
      for (const file of files) {
        const plain = await decryptBuffer(key, file.iv, file.ct);
        const encrypted = await encryptBuffer(nextKey, plain);
        nextFiles.push({...file, iv: encrypted.iv, ct: encrypted.data.buffer as ArrayBuffer});
      }
      const nextSettings = settingsRef.current;
      await idbPut('meta', nextMeta);
      await idbPutAll('entries', reEncryptedEntries);
      await idbPutAll('filemeta', nextFiles.map(fileMetaOf));
      await idbPutAll(
        'files',
        nextFiles.map((file) => ({id: file.id, ct: file.ct as ArrayBuffer})),
      );
      await idbPut('local', await makeLocalRecord(nextKey, nextSettings));
      keyRef.current = nextKey;
      metaRef.current = nextMeta;
      setMeta(nextMeta);
      recordsRef.current = reEncryptedEntries;
      fileMetaRef.current = nextFiles.map(fileMetaOf);
      revokeAttachmentUrls();
      notify('口令已更新；其他设备需要使用新口令重新恢复', 'good');
      if (nextSettings.sync?.enabled) scheduleSync(800);
    },
    [entries, notify, readAllFileRecords, revokeAttachmentUrls, scheduleSync],
  );

  const exportEncryptedBackup = useCallback(async () => {
    const key = keyRef.current;
    const currentMeta = metaRef.current;
    if (!key || !currentMeta) throw new Error('庭院已锁定');
    const files = await readAllFileRecords(fileMetaRef.current);
    const payload = {
      app: 'hakoniwa-vault-backup',
      version: 1,
      exportedAt: Date.now(),
      meta: currentMeta,
      entries: recordsRef.current,
      files: files.map((file) => ({...fileMetaOf(file), ct: toBase64(file.ct)})),
    };
    downloadText(
      `hakoniwa-vault-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(payload, null, 2),
      'application/json',
    );
    notify('加密备份已开始下载；它仍需要你的口令才能打开', 'good');
  }, [notify, readAllFileRecords]);

  const exportMarkdown = useCallback(async () => {
    const visible = entries.filter((entry) => isVisible(entry));
    const parts = visible.map((entry) => {
      const tags = entry.tags.length ? `分类: ${KINDS[entry.kind].label}\n标签: ${entry.tags.join(', ')}` : '';
      return `# ${entry.title || KINDS[entry.kind].label}\n\n_创建于 ${new Date(entry.createdAt).toLocaleString('zh-CN')}_\n\n${tags}\n\n${entry.body}\n\n---\n`;
    });
    downloadText(
      `hakoniwa-vault-${new Date().toISOString().slice(0, 10)}.md`,
      parts.join('\n'),
      'text/markdown;charset=utf-8',
    );
    notify('已导出 Markdown（不含加密附件）');
  }, [entries, notify]);

  const importEncryptedBackup = useCallback(
    async (file: File, passphrase: string) => {
      const text = await file.text();
      const data = JSON.parse(text) as {
        app?: string;
        version?: number;
        meta?: VaultMeta;
        entries?: EntryRecord[];
        files?: (FileMeta & {ct: string})[];
      };
      if (data.app !== 'hakoniwa-vault-backup' || !data.meta) throw new Error('这不是有效的箱庭加密备份');
      const backupMeta = data.meta;
      const key = await deriveKey(passphrase, backupMeta.salt, backupMeta.iterations);
      if (!(await checkVerifier(key, backupMeta.verifier))) throw new Error('备份口令不正确');
      await idbClear('entries');
      await idbClear('files');
      await idbClear('filemeta');
      await idbClear('local');
      await idbPut('meta', backupMeta);
      await idbPutAll('entries', data.entries ?? []);
      const fileRecords: {id: string; ct: ArrayBuffer}[] = [];
      const metas: FileMeta[] = [];
      for (const item of data.files ?? []) {
        const {ct, ...meta} = item;
        metas.push(meta);
        fileRecords.push({id: meta.id, ct: fromBase64(ct).buffer as ArrayBuffer});
      }
      await idbPutAll('filemeta', metas);
      await idbPutAll('files', fileRecords);
      metaRef.current = backupMeta;
      setMeta(backupMeta);
      const initial = emptyLocalSettings();
      await idbPut('local', await makeLocalRecord(key, initial));
      await finishUnlock(key, backupMeta);
      notify('备份已恢复到这台设备', 'good');
    },
    [finishUnlock, notify],
  );

  const restoreFromSync = useCallback(
    async (passphrase: string, config: SyncConfig) => {
      const normalized = normalizeConfig(config);
      const remote = await readRemoteSnapshot(normalized);
      if (!remote) throw new Error('远端还没有同步文件');
      const iterations = remote.envelope.iterations;
      const key = await deriveKey(passphrase, remote.envelope.salt, iterations);
      let payload;
      try {
        payload = await openEnvelope(key, remote.envelope);
      } catch {
        throw new Error('口令不正确，或这不是本庭院的同步文件');
      }
      const verifier = await makeVerifier(key);
      const remoteMeta: VaultMeta = {
        key: 'meta',
        version: 1,
        salt: remote.envelope.salt,
        iterations,
        verifier,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const files: FileRecord[] = payload.files.map((file) => ({
        ...file,
        ct: fromBase64(file.ct).buffer as ArrayBuffer,
      }));
      await idbClear('entries');
      await idbClear('files');
      await idbClear('filemeta');
      await idbClear('local');
      await idbPut('meta', remoteMeta);
      await idbPutAll('entries', payload.entries);
      await idbPutAll('filemeta', files.map(fileMetaOf));
      await idbPutAll(
        'files',
        files.map((file) => ({id: file.id, ct: file.ct as ArrayBuffer})),
      );
      metaRef.current = remoteMeta;
      setMeta(remoteMeta);
      const initial: LocalSettings = {
        ...emptyLocalSettings(),
        sync: {...normalized, enabled: true},
        lastSyncAt: Date.now(),
        remoteUpdatedAt: remote.envelope.updatedAt,
      };
      await idbPut('local', await makeLocalRecord(key, initial));
      await finishUnlock(key, remoteMeta);
      notify('已从远端恢复庭院', 'good');
    },
    [finishUnlock, notify],
  );

  const importShared = useCallback(async () => {
    if (!('caches' in window)) return;
    const cache = await caches.open(SHARE_CACHE);
    const response = await cache.match(SHARE_URL);
    if (!response) return;
    await cache.delete(SHARE_URL);
    try {
      const data = (await response.json()) as {
        title?: string;
        text?: string;
        url?: string;
        files?: {name: string; type: string; data: string}[];
      };
      const entry = makeEntry('clip');
      entry.title = (data.title ?? data.text ?? '').trim().slice(0, 80) || '分享的内容';
      const lines = [data.text?.trim(), data.url?.trim()].filter(Boolean);
      entry.url = data.url ?? '';
      entry.body = `${lines.join('\n\n')}\n\n## 为什么收藏\n\n`;
      const attachments = [];
      for (const item of data.files ?? []) {
        const blob = base64ToBlob(item.data, item.type);
        const stored = await storeAttachment(await blob.arrayBuffer(), {
          name: item.name,
          mime: item.type || blob.type,
        });
        if (stored) attachments.push(stored);
      }
      if (attachments.length) {
        entry.attachments = attachments.map(({id, name, mime, size, width, height}) => ({
          id,
          name,
          mime,
          size,
          width,
          height,
        }));
        entry.body += `\n\n${attachments.map((item) => `![${item.name}](vault-file:${item.id})`).join('\n\n')}`;
      }
      await persistEntryRecord(entry);
      notify('分享内容已经收进来', 'good');
    } catch {
      noteError('读取分享内容失败，请重试');
    }
  }, [noteError, notify, persistEntryRecord, storeAttachment]);

  const clearCaptureIntent = useCallback(() => setCaptureIntent(null), []);

  useEffect(() => {
    if (status !== 'unlocked' || shareHandledRef.current) return;
    shareHandledRef.current = true;
    const params = new URLSearchParams(window.location.search);
    if (params.get('shared') === '1') {
      stripQueryKeys('shared');
      void importShared();
    }
  }, [status, importShared]);

  useEffect(() => {
    if (status !== 'unlocked') return;
    const minutes = settings.autoLockMinutes;
    if (!minutes || minutes <= 0) return;
    let timer = window.setTimeout(() => lock(), minutes * 60_000);
    const reset = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => lock(), minutes * 60_000);
    };
    const events: (keyof WindowEventMap)[] = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
    for (const event of events) window.addEventListener(event, reset, {passive: true});
    const onVisible = () => {
      if (document.visibilityState === 'visible') reset();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearTimeout(timer);
      for (const event of events) window.removeEventListener(event, reset);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [status, settings.autoLockMinutes, lock]);

  useEffect(() => {
    if (status !== 'unlocked' || !settings.sync?.enabled) {
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = null;
      return;
    }
    const tick = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) void performSync('poll');
    };
    pollRef.current = window.setInterval(tick, 25_000);
    const onVisible = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) void performSync('focus');
    };
    const onOnline = () => void performSync('online');
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);
    window.addEventListener('focus', onOnline);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = null;
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('focus', onOnline);
    };
  }, [status, settings.sync?.enabled, performSync]);

  const value = useMemo<VaultContextValue>(
    () => ({
      status,
      meta,
      entries,
      fileMeta,
      settings,
      syncState,
      attachmentUrls,
      captureIntent,
      errors,
      createVault,
      unlock,
      lock,
      resetDevice,
      createEntry,
      saveEntry,
      deleteEntry,
      restoreEntry,
      purgeEntry,
      emptyTrash,
      addAttachments,
      ensureAttachmentUrls,
      removeAttachment,
      updateSettings,
      connectSync,
      disconnectSync,
      syncNow,
      changePassphrase,
      exportEncryptedBackup,
      exportMarkdown,
      importEncryptedBackup,
      restoreFromSync,
      clearCaptureIntent,
      notify,
    }),
    [
      status,
      meta,
      entries,
      fileMeta,
      settings,
      syncState,
      attachmentUrls,
      captureIntent,
      errors,
      createVault,
      unlock,
      lock,
      resetDevice,
      createEntry,
      saveEntry,
      deleteEntry,
      restoreEntry,
      purgeEntry,
      emptyTrash,
      addAttachments,
      ensureAttachmentUrls,
      removeAttachment,
      updateSettings,
      connectSync,
      disconnectSync,
      syncNow,
      changePassphrase,
      exportEncryptedBackup,
      exportMarkdown,
      importEncryptedBackup,
      restoreFromSync,
      clearCaptureIntent,
      notify,
    ],
  );

  return (
    <VaultContext.Provider value={value}>
      {children}
      <div className="vault-toasts" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`vault-toast vault-toast--${toast.tone}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </VaultContext.Provider>
  );
};
