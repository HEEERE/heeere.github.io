import {identityPaths} from '../data/identity';
/** An open miniature room, a lit window and a plinth: the Hakoniwa signature. */
export const IdentityMark = () => (
  <svg className="identity-mark" viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <path d={identityPaths.room} stroke="currentColor" strokeWidth="1.2" />
    <path d={identityPaths.plinth} stroke="currentColor" strokeWidth="1" opacity=".55" />
    <path d={identityPaths.window} fill="currentColor" />
  </svg>
);
