// Uses the existing gh login only in memory. Writes and removes a unique encrypted
// test file; never touches the user's vault.json or exports authentication data.
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {createServer} from 'vite';

const server = await createServer({configFile:false, server:{middlewareMode:true, watch:{ignored:['**/*']}}, appType:'custom'});
const config = {owner:'HEEERE', repo:'hakoniwa-vault', branch:'main', path:`.sync-check/${randomUUID()}.json`, token:'', enabled:true};
let sha;
try {
  config.token = execFileSync('C:/Program Files/GitHub CLI/gh.exe', ['auth','token'], {encoding:'utf8', stdio:['ignore','pipe','ignore']}).trim();
  const crypt = await server.ssrLoadModule('/src/vault/lib/crypto.ts');
  const sync = await server.ssrLoadModule('/src/vault/lib/sync.ts');
  const connection = await sync.testConnection(config);
  assert.equal(connection.ok, true);
  assert.equal(connection.isPrivate, true);
  assert.equal(await sync.readRemoteSnapshot(config), null);
  const salt = crypt.createSalt();
  const key = await crypt.deriveKey(randomUUID(), salt, crypt.KDF_ITERATIONS);
  const encrypted = await crypt.encryptJson(key, {title:'Garden sync verification', body:'Disposable synthetic data only'});
  const record = {id:randomUUID(), updatedAt:Date.now(), ...encrypted};
  const envelope = await sync.buildEnvelope(key, salt, crypt.KDF_ITERATIONS, [record], []);
  sha = await sync.writeRemoteSnapshot(config, envelope, null, 'Verify encrypted Garden sync');
  const remote = await sync.readRemoteSnapshot(config);
  assert.ok(remote);
  const payload = await sync.openEnvelope(key, remote.envelope);
  assert.deepEqual(payload.entries, [record]);
  const secondDevice = sync.mergeRemote([], [], payload);
  assert.equal(secondDevice.localChanged, true);
  assert.equal(secondDevice.remoteChanged, false);
  assert.equal((await crypt.decryptJson(key, secondDevice.entries[0])).title, 'Garden sync verification');
  console.log('PASS private repository / encrypted upload / download / second-device merge and decryption');
} finally {
  if (sha) {
    const response = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.path}`, {
      method:'DELETE', headers:{Authorization:`Bearer ${config.token}`, Accept:'application/vnd.github+json', 'Content-Type':'application/json'},
      body:JSON.stringify({message:'Remove disposable Garden sync check',sha,branch:config.branch}),
    });
    if (!response.ok) throw new Error(`Test file cleanup failed: HTTP ${response.status}`);
    console.log('PASS disposable test file removed; vault.json untouched');
  }
  config.token = '';
  await server.close();
}
