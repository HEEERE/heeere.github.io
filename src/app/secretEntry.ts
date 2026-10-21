import {useEffect, useMemo, useRef} from 'react';
import type {MouseEvent, PointerEvent} from 'react';

/**
 * The private garden is not linked from anywhere on the public site.
 *
 * Two quiet ways in:
 *  - type "garden" anywhere on the page (letters only, outside form fields);
 *  - press and hold the 箱 brand in the navigation for about a second.
 *
 * Both are discoverable only if you already know they exist, and both land on
 * /vault/ where the passphrase gate takes over.
 */

const WORD = 'garden';
const WORD_WINDOW_MS = 2600;
const HOLD_MS = 1000;

export const openPrivateGarden = (): void => {
  window.location.assign('/vault/');
};

const isTypingTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
};

export const useSecretEntry = () => {
  const typed = useRef('');
  const typedAt = useRef(0);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key.length !== 1) return;
      if (isTypingTarget(event.target)) return;
      const now = Date.now();
      if (now - typedAt.current > WORD_WINDOW_MS) typed.current = '';
      typedAt.current = now;
      typed.current = `${typed.current}${event.key.toLowerCase()}`.slice(-WORD.length);
      if (typed.current === WORD) {
        typed.current = '';
        openPrivateGarden();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return useMemo(() => {
    let timer: number | null = null;
    let fired = false;

    const clear = () => {
      if (timer !== null) {
        window.clearTimeout(timer);
        timer = null;
      }
    };

    return {
      onPointerDown: (event: PointerEvent<HTMLAnchorElement>) => {
        if (event.button !== 0) return;
        fired = false;
        clear();
        timer = window.setTimeout(() => {
          fired = true;
          timer = null;
          openPrivateGarden();
        }, HOLD_MS);
      },
      onPointerUp: clear,
      onPointerLeave: clear,
      onPointerCancel: clear,
      onContextMenu: (event: MouseEvent<HTMLAnchorElement>) => {
        if (fired) event.preventDefault();
      },
      onClick: (event: MouseEvent<HTMLAnchorElement>) => {
        if (!fired) return;
        fired = false;
        event.preventDefault();
      },
    };
  }, []);
};
