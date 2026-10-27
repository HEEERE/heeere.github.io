/**
 * 私人庭院 · Service Worker
 *
 * 只做两件事：
 * 1. 接收系统分享（Web Share Target），把内容暂存在 Cache Storage 里，然后
 *    跳到 /vault/?shared=1，由页面在解锁之后取走并加密保存。
 * 2. 让页面具备可安装（standalone）的条件。
 *
 * 刻意不缓存页面和资源：站点的更新永远是一次普通刷新即可生效，不会出现
 * 旧版本被 Service Worker 卡住的情况。离线时无法打开庭院，这是有意的取舍。
 */

const SHARE_CACHE = 'hakoniwa-vault-share';
const SHARE_KEY = '/vault/__share';
const SHARE_REDIRECT = '/vault/?shared=1';
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_TOTAL_BYTES = 24 * 1024 * 1024;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

const toBase64 = async (file) => {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
};

const handleShare = async (request) => {
  let payload = {title: '', text: '', url: '', files: []};
  try {
    const form = await request.formData();
    const title = form.get('title');
    const text = form.get('text');
    const url = form.get('url');
    if (typeof title === 'string') payload.title = title.slice(0, 400);
    if (typeof text === 'string') payload.text = text.slice(0, 20000);
    if (typeof url === 'string') payload.url = url.slice(0, 2000);

    let total = 0;
    for (const value of form.getAll('files')) {
      if (typeof value === 'string' || !value || typeof value.arrayBuffer !== 'function') continue;
      const file = value;
      if (file.size > MAX_FILE_BYTES) continue;
      total += file.size;
      if (total > MAX_TOTAL_BYTES) break;
      payload.files.push({
        name: (file.name || '分享的图片').slice(0, 160),
        type: file.type || 'application/octet-stream',
        data: await toBase64(file),
      });
    }

    const cache = await caches.open(SHARE_CACHE);
    await cache.put(
      SHARE_KEY,
      new Response(JSON.stringify(payload), {
        headers: {'Content-Type': 'application/json'},
      }),
    );
  } catch {
    /* 分享内容读不出来也照样把用户带到庭院，页面会给出提示 */
  }
  return Response.redirect(new URL(SHARE_REDIRECT, self.location.origin).href, 303);
};

self.addEventListener('fetch', (event) => {
  const {request} = event;
  const url = new URL(request.url);
  if (request.method === 'POST' && url.origin === self.location.origin && url.pathname === SHARE_KEY) {
    event.respondWith(handleShare(request));
  }
});
