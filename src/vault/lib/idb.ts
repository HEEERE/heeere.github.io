/**
 * Tiny IndexedDB wrapper for the vault.
 *
 * Stores:
 *  - meta    : plaintext vault metadata (salt / KDF iterations / verifier)
 *  - entries : encrypted entry records `{id, updatedAt, deletedAt, iv, ct}`
 *  - files   : encrypted attachment payloads `{id, ct}` (ct = ArrayBuffer)
 *  - filemeta: attachment metadata `{id, name, mime, size, iv, …}`
 *  - local   : encrypted device settings (sync config, DSH link, auto-lock …)
 */

export type VaultStore = 'meta' | 'entries' | 'files' | 'filemeta' | 'local';

const DB_NAME = 'hakoniwa-vault';
const DB_VERSION = 2;

let dbPromise: Promise<IDBDatabase> | null = null;

export const openVaultDb = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', {keyPath: 'key'});
      if (!db.objectStoreNames.contains('entries')) db.createObjectStore('entries', {keyPath: 'id'});
      if (!db.objectStoreNames.contains('files')) db.createObjectStore('files', {keyPath: 'id'});
      if (!db.objectStoreNames.contains('filemeta')) db.createObjectStore('filemeta', {keyPath: 'id'});
      if (!db.objectStoreNames.contains('local')) db.createObjectStore('local', {keyPath: 'key'});
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('无法打开本地数据库'));
    request.onblocked = () => reject(new Error('数据库被其他标签页占用，请关闭其他页面后重试'));
  });
  return dbPromise;
};

const run = <T>(
  store: VaultStore,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> =>
  openVaultDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(store, mode);
        const request = action(tx.objectStore(store));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error(`IndexedDB ${store} 操作失败`));
        tx.onabort = () => reject(tx.error ?? new Error(`IndexedDB ${store} 事务中止`));
      }),
  );

export const idbGet = <T>(store: VaultStore, key: IDBValidKey): Promise<T | undefined> =>
  run<T | undefined>(store, 'readonly', (objectStore) => objectStore.get(key) as IDBRequest<T | undefined>);

export const idbGetAll = <T>(store: VaultStore): Promise<T[]> =>
  run<T[]>(store, 'readonly', (objectStore) => objectStore.getAll() as IDBRequest<T[]>);

export const idbPut = <T>(store: VaultStore, value: T): Promise<void> =>
  run<IDBValidKey>(store, 'readwrite', (objectStore) => objectStore.put(value)).then(() => undefined);

export const idbPutAll = async <T>(store: VaultStore, values: T[]): Promise<void> => {
  if (!values.length) return;
  const db = await openVaultDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const objectStore = tx.objectStore(store);
    for (const value of values) objectStore.put(value);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error(`IndexedDB ${store} 批量写入失败`));
    tx.onabort = () => reject(tx.error ?? new Error(`IndexedDB ${store} 事务中止`));
  });
};

export const idbDelete = (store: VaultStore, key: IDBValidKey): Promise<void> =>
  run<undefined>(store, 'readwrite', (objectStore) => objectStore.delete(key)).then(() => undefined);

export const idbDeleteMany = async (store: VaultStore, keys: IDBValidKey[]): Promise<void> => {
  if (!keys.length) return;
  const db = await openVaultDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const objectStore = tx.objectStore(store);
    for (const key of keys) objectStore.delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error(`IndexedDB ${store} 批量删除失败`));
  });
};

export const idbClear = (store: VaultStore): Promise<void> =>
  run<undefined>(store, 'readwrite', (objectStore) => objectStore.clear()).then(() => undefined);

export const idbCount = (store: VaultStore): Promise<number> =>
  run<number>(store, 'readonly', (objectStore) => objectStore.count());

/** Wipe the local vault completely (used by "重置此设备"). */
export const destroyVaultDb = async (): Promise<void> => {
  if (dbPromise) {
    const db = await dbPromise.catch(() => null);
    db?.close();
    dbPromise = null;
  }
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error('删除本地数据库失败'));
    request.onblocked = () => resolve();
  });
};
