import {spawn} from 'node:child_process';
import {preview} from 'vite';

const server = await preview({preview: {host: '127.0.0.1', port: 4175, strictPort: true}});
const base = 'http://127.0.0.1:4175/';
try {
  for (const script of ['release-qa', 'portfolio-qa', 'e2e', 'experience-qa']) {
    await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [`scripts/${script}.mjs`, base], {stdio: 'inherit'});
      child.on('error', reject);
      child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${script} failed (${code})`)));
    });
  }
} finally {
  await new Promise((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()));
}
