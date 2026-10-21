import {describe, expect, it} from 'vitest';
import {
  KDF_ITERATIONS,
  MIN_ITERATIONS,
  checkVerifier,
  createSalt,
  decryptBuffer,
  decryptString,
  deriveKey,
  encryptBuffer,
  encryptString,
  makeVerifier,
} from './lib/crypto';
import {
  allTags,
  countByKind,
  entrySnippet,
  entryTitle,
  filterEntries,
  formatBytes,
  makeEntry,
  mergeEntryRecords,
  mergeFileRecords,
  splitTags,
  toggleTag,
  type Entry,
  type EntryRecord,
} from './lib/model';
import {renderMarkdown, extractVaultImages} from './lib/markdown';
import {SNAPSHOT_CHECK, buildEnvelope, mergeRemote, openEnvelope} from './lib/sync';

const PASSPHRASE = 'hakoniwa-test-passphrase';

const unlockKey = async () => {
  const salt = createSalt();
  const key = await deriveKey(PASSPHRASE, salt, MIN_ITERATIONS);
  return {key, salt};
};

describe('vault crypto', () => {
  it('uses strong KDF defaults', () => {
    expect(KDF_ITERATIONS).toBeGreaterThanOrEqual(600_000);
    expect(MIN_ITERATIONS).toBeGreaterThanOrEqual(100_000);
  });

  it('round-trips strings and rejects the wrong passphrase', async () => {
    const {key, salt} = await unlockKey();
    const cipher = await encryptString(key, '雨夜里的一盏灯');
    expect(await decryptString(key, cipher)).toBe('雨夜里的一盏灯');

    const wrong = await deriveKey('another-passphrase', salt, MIN_ITERATIONS);
    await expect(decryptString(wrong, cipher)).rejects.toThrow();
  });

  it('round-trips binary attachments', async () => {
    const {key} = await unlockKey();
    const source = new TextEncoder().encode('attachment-bytes').buffer;
    const cipher = await encryptBuffer(key, source);
    const plain = await decryptBuffer(key, cipher.iv, cipher.data);
    expect(new TextDecoder().decode(plain)).toBe('attachment-bytes');
  });

  it('verifies passphrases without exposing the payload', async () => {
    const {key, salt} = await unlockKey();
    const verifier = await makeVerifier(key);
    expect(await checkVerifier(key, verifier)).toBe(true);
    const wrong = await deriveKey('something-else', salt, MIN_ITERATIONS);
    expect(await checkVerifier(wrong, verifier)).toBe(false);
  });
});

describe('vault model', () => {
  const at = Date.UTC(2026, 9, 21, 9, 30);
  const note = makeEntry('note', at);
  const idea = makeEntry('idea', at + 1000);

  it('derives titles, snippets and tags', () => {
    const entry: Entry = {...idea, title: '', body: '## 一个想法\n\n把场景当成目录。', tags: ['Design', 'design']};
    expect(entryTitle(entry)).toContain('一个想法');
    expect(entrySnippet(entry)).toContain('把场景当成目录');
    expect(splitTags('agent, todo  #design')).toEqual(['agent', 'todo', 'design']);
    expect(toggleTag(['agent'], 'todo')).toEqual(['agent', 'todo']);
    expect(toggleTag(['agent', 'todo'], 'todo')).toEqual(['agent']);
  });

  it('filters by view, kind, tag and query', () => {
    const entries: Entry[] = [note, {...idea, tags: ['design'], body: '场景目录'}];
    expect(filterEntries(entries, {view: 'all', query: '', sort: 'updated'})).toHaveLength(2);
    expect(filterEntries(entries, {view: 'all', query: '目录', sort: 'updated'})).toHaveLength(1);
    expect(filterEntries(entries, {view: 'kind', kind: 'idea', query: '', sort: 'updated'})).toHaveLength(1);
    expect(filterEntries(entries, {view: 'tag', tag: 'design', query: '', sort: 'updated'})).toHaveLength(1);
    expect(allTags(entries).map((item) => item.tag)).toEqual(['design']);
    expect(countByKind(entries).idea).toBe(1);
  });

  it('formats byte sizes', () => {
    expect(formatBytes(900)).toContain('900');
    expect(formatBytes(2_400_000)).toMatch(/MB/);
  });
});

describe('vault sync merge', () => {
  const record = (id: string, updatedAt: number): EntryRecord => ({
    id,
    updatedAt,
    iv: 'iv',
    ct: `ct-${updatedAt}`,
  });

  it('keeps the newest entry version from either side', () => {
    const merged = mergeEntryRecords([record('a', 10), record('b', 30)], [record('a', 20), record('c', 5)]);
    expect(merged.map((item) => [item.id, item.updatedAt])).toEqual([
      ['a', 20],
      ['b', 30],
      ['c', 5],
    ]);
  });

  it('keeps local files when ids collide', () => {
    const file = (id: string, createdAt: number) => ({
      id,
      name: `${id}.jpg`,
      mime: 'image/jpeg',
      size: 10,
      createdAt,
      iv: 'iv',
      ct: new Uint8Array([1, 2, 3]),
    });
    const merged = mergeFileRecords([file('x', 10)], [file('x', 20), file('y', 5)]);
    expect(merged.map((item) => item.createdAt)).toEqual([10, 5]);
  });

  it('builds an envelope that only the passphrase opens', async () => {
    const {key, salt} = await unlockKey();
    const envelope = await buildEnvelope(key, salt, MIN_ITERATIONS, [record('a', 10)], []);
    const payload = await openEnvelope(key, envelope);
    expect(payload.check).toBe(SNAPSHOT_CHECK);
    expect(payload.entries).toHaveLength(1);

    const wrong = await deriveKey('nope-nope-nope', salt, MIN_ITERATIONS);
    await expect(openEnvelope(wrong, envelope)).rejects.toThrow();

    const remote = mergeRemote([record('a', 10)], [], payload);
    expect(remote.localChanged).toBe(false);
    expect(remote.entries).toHaveLength(1);
  });
});

describe('vault markdown', () => {
  it('escapes raw html before formatting', () => {
    const html = renderMarkdown('<img src=x onerror=alert(1)> **bold**');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
    expect(html).toContain('<strong>bold</strong>');
  });

  it('renders headings, lists, code and safe links', () => {
    const html = renderMarkdown('## 标题\n\n- 一\n- 二\n\n```js\nconst a = 1;\n```\n\n[链接](https://example.com)');
    expect(html).toContain('<h2>标题</h2>');
    expect(html).toContain('<li>一</li>');
    expect(html).toContain('const a = 1;');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(renderMarkdown('[坏链接](javascript:alert(1))')).not.toContain('href="javascript:');
  });

  it('resolves encrypted attachment images', () => {
    const source = '![图](vault-file:abc123)';
    expect(extractVaultImages(source)).toEqual(['abc123']);
    expect(renderMarkdown(source, {resolveImage: (id) => (id === 'abc123' ? 'blob:demo' : undefined)})).toContain(
      'src="blob:demo"',
    );
    expect(renderMarkdown(source)).toContain('附件 abc123');
  });
});
