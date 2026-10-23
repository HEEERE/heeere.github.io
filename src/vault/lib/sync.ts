import {decryptJson, encryptJson, fromBase64, toBase64} from './crypto';
import type {CipherText} from './crypto';
import {mergeEntryRecords, mergeFileRecords} from './model';
import type {EntryRecord, FileRecord, SyncConfig} from './model';

/* -------------------------------------------------------------------------- */
/* Snapshot format                                                            */
/* -------------------------------------------------------------------------- */

export const SNAPSHOT_CHECK = 'hakoniwa-private-garden:v1';

export type SerializedFile = Omit<FileRecord, 'ct'> & {ct: string};

export type SnapshotPayload = {
  v: 1;
  check: typeof SNAPSHOT_CHECK;
  updatedAt: number;
  entries: EntryRecord[];
  files: SerializedFile[];
};

export type SnapshotEnvelope = {
  v: 1;
  app: 'hakoniwa-vault';
  updatedAt: number;
  salt: string;
  iterations: number;
  cipher: CipherText;
};

export type RemoteSnapshot = {
  sha: string;
  envelope: SnapshotEnvelope;
};

const serializeFiles = (files: FileRecord[]): SerializedFile[] =>
  files.map((file) => ({
    id: file.id,
    name: file.name,
    mime: file.mime,
    size: file.size,
    width: file.width,
    height: file.height,
    createdAt: file.createdAt,
    iv: file.iv,
    ct: toBase64(file.ct),
  }));

const deserializeFiles = (files: SerializedFile[]): FileRecord[] =>
  files.map((file) => ({
    ...file,
    ct: fromBase64(file.ct).buffer,
  }));

export const maxUpdatedAt = (entries: EntryRecord[], files: FileRecord[]): number =>
  Math.max(0, ...entries.map((entry) => entry.updatedAt), ...files.map((file) => file.createdAt));

export const buildEnvelope = async (
  key: CryptoKey,
  salt: string,
  iterations: number,
  entries: EntryRecord[],
  files: FileRecord[],
): Promise<SnapshotEnvelope> => {
  const payload: SnapshotPayload = {
    v: 1,
    check: SNAPSHOT_CHECK,
    updatedAt: maxUpdatedAt(entries, files),
    entries,
    files: serializeFiles(files),
  };
  return {
    v: 1,
    app: 'hakoniwa-vault',
    updatedAt: payload.updatedAt,
    salt,
    iterations,
    cipher: await encryptJson(key, payload),
  };
};

export const openEnvelope = async (key: CryptoKey, envelope: SnapshotEnvelope): Promise<SnapshotPayload> => {
  if (envelope?.app !== 'hakoniwa-vault' || envelope.v !== 1) throw new Error('这不是箱庭的同步文件');
  const payload = await decryptJson<SnapshotPayload>(key, envelope.cipher);
  if (payload.check !== SNAPSHOT_CHECK) throw new Error('同步文件校验失败');
  return payload;
};

export const snapshotToFiles = (payload: SnapshotPayload): FileRecord[] => deserializeFiles(payload.files);

export const payloadFiles = (payload: SnapshotPayload): FileRecord[] => deserializeFiles(payload.files);

const stableEntries = (entries: EntryRecord[]): string =>
  JSON.stringify(
    [...entries]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((entry) => [entry.id, entry.updatedAt, entry.deletedAt ?? 0, entry.ct]),
  );

const stableFiles = (files: SerializedFile[]): string =>
  JSON.stringify(
    [...files]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((file) => [file.id, file.iv, file.ct]),
  );

export const payloadsEqual = (a: SnapshotPayload, b: SnapshotPayload): boolean =>
  stableEntries(a.entries) === stableEntries(b.entries) && stableFiles(a.files) === stableFiles(b.files);

export type MergeResult = {
  entries: EntryRecord[];
  files: FileRecord[];
  remotePayload: SnapshotPayload;
  mergedPayload: SnapshotPayload;
  localChanged: boolean;
  remoteChanged: boolean;
};

export const mergeRemote = (
  localEntries: EntryRecord[],
  localFiles: FileRecord[],
  remote: SnapshotPayload,
): MergeResult => {
  const remoteFiles = deserializeFiles(remote.files);
  const entries = mergeEntryRecords(localEntries, remote.entries);
  const files = mergeFileRecords(localFiles, remoteFiles);
  const mergedPayload: SnapshotPayload = {
    v: 1,
    check: SNAPSHOT_CHECK,
    updatedAt: Math.max(remote.updatedAt, maxUpdatedAt(entries, files)),
    entries,
    files: serializeFiles(files),
  };
  return {
    entries,
    files,
    remotePayload: remote,
    mergedPayload,
    localChanged: !payloadsEqual(mergedPayload, {
      v: 1,
      check: SNAPSHOT_CHECK,
      updatedAt: maxUpdatedAt(localEntries, localFiles),
      entries: localEntries,
      files: serializeFiles(localFiles),
    }),
    remoteChanged: !payloadsEqual(mergedPayload, remote),
  };
};

/* -------------------------------------------------------------------------- */
/* GitHub Contents API                                                        */
/* -------------------------------------------------------------------------- */

export type SyncTestResult = {
  ok: boolean;
  message: string;
  warning?: string;
  isPrivate?: boolean;
};

const API = 'https://api.github.com';

export const normalizeConfig = (config: SyncConfig): SyncConfig => ({
  owner: config.owner.trim(),
  repo: config.repo.trim(),
  branch: config.branch.trim() || 'main',
  path: config.path.trim().replace(/^\/+/, '') || 'vault.json',
  token: config.token.trim(),
  enabled: config.enabled,
});

const encodePath = (path: string): string => path.split('/').map(encodeURIComponent).join('/');

const authHeaders = (config: SyncConfig): HeadersInit => ({
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${config.token}`,
  'X-GitHub-Api-Version': '2022-11-28',
});

const readError = async (response: Response): Promise<string> => {
  try {
    const data = (await response.json()) as {message?: string};
    return data.message ? `${data.message}` : `HTTP ${response.status}`;
  } catch {
    return `HTTP ${response.status}`;
  }
};

const fileUrl = (config: SyncConfig): string =>
  `${API}/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}/contents/${encodePath(config.path)}?ref=${encodeURIComponent(config.branch)}`;

export const testConnection = async (config: SyncConfig): Promise<SyncTestResult> => {
  const normalized = normalizeConfig(config);
  if (!normalized.owner || !normalized.repo) return {ok: false, message: '请填写 owner/repo'};
  if (!normalized.token) return {ok: false, message: '请填写访问令牌'};
  try {
    const repoResponse = await fetch(
      `${API}/repos/${encodeURIComponent(normalized.owner)}/${encodeURIComponent(normalized.repo)}`,
      {headers: authHeaders(normalized)},
    );
    if (!repoResponse.ok) return {ok: false, message: `无法访问仓库：${await readError(repoResponse)}`};
    const repo = (await repoResponse.json()) as {private?: boolean; full_name?: string};
    if (!repo.private) return {ok: false, isPrivate: false, message: '请选择私有仓库，庭院不向公开仓库同步。'};
    const fileResponse = await fetch(fileUrl(normalized), {headers: authHeaders(normalized)});
    if (fileResponse.status === 404) {
      return {
        ok: true,
        message: `已访问私有仓库 ${repo.full_name ?? normalized.repo}，首次同步将创建文件并验证写入权限`,
        isPrivate: repo.private,
        warning: repo.private ? undefined : '这个仓库是公开的。内容虽然已加密，仍建议改为私有仓库。',
      };
    }
    if (!fileResponse.ok) return {ok: false, message: `读取同步文件失败：${await readError(fileResponse)}`};
    return {
      ok: true,
      message: `已连接 ${repo.full_name ?? normalized.repo}，同步文件存在`,
      isPrivate: repo.private,
      warning: repo.private ? undefined : '这个仓库是公开的。内容虽然已加密，仍建议改为私有仓库。',
    };
  } catch (error) {
    return {ok: false, message: `网络或跨域错误：${error instanceof Error ? error.message : String(error)}`};
  }
};

export const readRemoteSnapshot = async (config: SyncConfig): Promise<RemoteSnapshot | null> => {
  const normalized = normalizeConfig(config);
  const response = await fetch(fileUrl(normalized), {headers: authHeaders(normalized)});
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`读取同步文件失败：${await readError(response)}`);
  const data = (await response.json()) as {sha?: string; content?: string; encoding?: string};
  if (!data.content || !data.sha) throw new Error('同步文件为空或格式不正确');
  const text = data.encoding === 'base64' ? new TextDecoder().decode(fromBase64(data.content.replace(/\n/g, ''))) : data.content;
  const envelope = JSON.parse(text) as SnapshotEnvelope;
  return {sha: data.sha, envelope};
};

export const writeRemoteSnapshot = async (
  config: SyncConfig,
  envelope: SnapshotEnvelope,
  sha: string | null,
  message: string,
): Promise<string> => {
  const normalized = normalizeConfig(config);
  const body = JSON.stringify(envelope);
  const response = await fetch(`${API}/repos/${encodeURIComponent(normalized.owner)}/${encodeURIComponent(normalized.repo)}/contents/${encodePath(normalized.path)}`, {
    method: 'PUT',
    headers: {...authHeaders(normalized), 'Content-Type': 'application/json'},
    body: JSON.stringify({
      message,
      branch: normalized.branch,
      content: toBase64(new TextEncoder().encode(body)),
      ...(sha ? {sha} : {}),
    }),
  });
  if (!response.ok) throw new Error(`写入同步文件失败：${await readError(response)}`);
  const data = (await response.json()) as {content?: {sha?: string}};
  return data.content?.sha ?? '';
};
