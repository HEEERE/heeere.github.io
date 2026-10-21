/**
 * A small, deliberately limited Markdown renderer.
 *
 * Raw HTML is always escaped — the vault renders user text, never arbitrary
 * markup. Links are restricted to http(s)/mailto. Images may point at
 * `vault-file:<id>` attachments, which are resolved to object URLs by the app.
 */

export type MarkdownOptions = {
  resolveImage?: (id: string) => string | undefined;
  /** External links open in a new tab. */
  newTabLinks?: boolean;
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const safeHref = (raw: string): string => {
  const value = raw.trim();
  if (/^(https?:|mailto:)/i.test(value)) return value.replace(/"/g, '%22');
  return '#';
};

const inline = (source: string, options: MarkdownOptions): string => {
  const placeholders: string[] = [];
  const stash = (html: string): string => {
    placeholders.push(html);
    return `\u0000${placeholders.length - 1}\u0000`;
  };

  const newTab = options.newTabLinks === false ? '' : ' target="_blank" rel="noopener noreferrer"';
  let text = source;

  // 1. Code spans are protected first so their content is never formatted.
  text = text.replace(/`([^`]+)`/g, (_match, code: string) => stash(`<code>${escapeHtml(code)}</code>`));

  // 2. Images and links are parsed before escaping so the URL survives intact.
  text = text.replace(/!\[([^\]]*)]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_match, alt: string, src: string) => {
    if (src.startsWith('vault-file:')) {
      const id = src.slice('vault-file:'.length);
      const url = options.resolveImage?.(id);
      const caption = alt.trim() ? `<figcaption>${escapeHtml(alt.trim())}</figcaption>` : '';
      if (!url) {
        return stash(`<span class="md-image md-image--missing">图片附件 ${escapeHtml(id.slice(0, 6))}… 未解密</span>`);
      }
      return stash(
        `<figure class="md-image"><img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async" />${caption}</figure>`,
      );
    }
    if (/^https?:\/\//i.test(src)) {
      return stash(
        `<figure class="md-image"><a href="${escapeHtml(safeHref(src))}"${newTab}><img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" /></a></figure>`,
      );
    }
    return stash(`<span class="md-image md-image--missing">${escapeHtml(alt || src)}</span>`);
  });

  text = text.replace(/\[([^\]]+)]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_match, label: string, href: string) => {
    return stash(`<a href="${escapeHtml(safeHref(href))}"${newTab}>${formatPlain(label)}</a>`);
  });

  // 3. Escape everything that is left, then apply inline formatting.
  text = escapeHtml(text);
  text = text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/(^|[\s(])_([^_\n]+)_/g, '$1<em>$2</em>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>')
    .replace(/==([^=]+)==/g, '<mark>$1</mark>');

  // 4. Bare URLs become links.
  // eslint-disable-next-line no-control-regex -- \u0000 is an internal placeholder marker
  text = text.replace(/(https?:\/\/[^\s<>\u0000]+)/g, (url) => {
    let trimmed = url;
    let suffix = '';
    while (/[.,;:!?)]$/.test(trimmed)) {
      suffix = trimmed.slice(-1) + suffix;
      trimmed = trimmed.slice(0, -1);
    }
    return `<a href="${escapeHtml(trimmed)}"${newTab}>${trimmed}</a>${suffix}`;
  });

  // 5. Restore protected fragments (they may themselves contain placeholders, so loop).
  for (let pass = 0; pass < 3; pass += 1) {
    if (!text.includes('\u0000')) break;
    // eslint-disable-next-line no-control-regex -- internal placeholder delimiter
    text = text.replace(/\u0000(\d+)\u0000/g, (_match, index: string) => placeholders[Number(index)] ?? '');
  }
  return text;
};

/** Formatting helper used for link labels, keeps things simple. */
const formatPlain = (value: string): string => escapeHtml(value);

const isBlockStart = (line: string): boolean =>
  /^(#{1,6}\s|```|>\s?|([-*+]|\d+\.)\s+|-{3,}\s*$|\*{3,}\s*$)/.test(line);

export const renderMarkdown = (source: string, options: MarkdownOptions = {}): string => {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const out: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? '';

    if (!line.trim()) {
      index += 1;
      continue;
    }

    const fence = line.match(/^```([\w+-]*)\s*$/);
    if (fence) {
      const language = fence[1] ?? '';
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !/^```\s*$/.test(lines[index] ?? '')) {
        code.push(lines[index] ?? '');
        index += 1;
      }
      index += 1;
      out.push(
        `<pre class="md-code"${language ? ` data-lang="${escapeHtml(language)}"` : ''}><code>${escapeHtml(code.join('\n'))}</code></pre>`,
      );
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      const level = Math.min(4, heading[1]?.length ?? 1);
      out.push(`<h${level}>${inline(heading[2] ?? '', options)}</h${level}>`);
      index += 1;
      continue;
    }

    if (/^(-{3,}|\*{3,})\s*$/.test(line)) {
      out.push('<hr />');
      index += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quote: string[] = [];
      while (index < lines.length && /^>\s?/.test(lines[index] ?? '')) {
        quote.push((lines[index] ?? '').replace(/^>\s?/, ''));
        index += 1;
      }
      out.push(`<blockquote><p>${quote.map((row) => inline(row, options)).join('<br />')}</p></blockquote>`);
      continue;
    }

    const listMatch = line.match(/^\s*([-*+]|\d+\.)\s+/);
    if (listMatch) {
      const ordered = /^\d/.test(listMatch[1] ?? '');
      const items: string[] = [];
      while (index < lines.length) {
        const row = lines[index] ?? '';
        const item = row.match(/^\s*([-*+]|\d+\.)\s+(.*)$/);
        if (!item) break;
        let content = item[2] ?? '';
        let className = '';
        let marker = '';
        const task = content.match(/^\[( |x|X)]\s+(.*)$/);
        if (task) {
          className = ' class="md-task"';
          marker = `<span class="md-check${task[1] === ' ' ? '' : ' is-done'}">${task[1] === ' ' ? '' : '✓'}</span>`;
          content = task[2] ?? '';
        }
        items.push(`<li${className}>${marker}${inline(content, options)}</li>`);
        index += 1;
      }
      out.push(ordered ? `<ol>${items.join('')}</ol>` : `<ul>${items.join('')}</ul>`);
      continue;
    }

    const paragraph: string[] = [];
    while (index < lines.length) {
      const row = lines[index] ?? '';
      if (!row.trim() || isBlockStart(row)) break;
      paragraph.push(row);
      index += 1;
    }
    if (paragraph.length) out.push(`<p>${paragraph.map((row) => inline(row, options)).join('<br />')}</p>`);
    else index += 1;
  }

  return out.join('\n');
};

export const extractVaultImages = (markdown: string): string[] => {
  const ids = new Set<string>();
  const pattern = /!\[[^\]]*]\(vault-file:([^)\s]+)\)/g;
  for (const match of markdown.matchAll(pattern)) if (match[1]) ids.add(match[1]);
  return [...ids];
};
