/**
 * Vault cryptography.
 *
 * Everything private is encrypted at rest with a key derived from the owner's
 * passphrase. The passphrase itself is never stored, transmitted or logged.
 * PBKDF2-SHA-256 (600k iterations by default) + AES-256-GCM.
 */

export const KDF_ITERATIONS = 600_000;
export const MIN_ITERATIONS = 100_000;
export const MIN_PASSPHRASE_LENGTH = 8;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export type CipherText = {
  /** base64url random 12-byte IV */
  iv: string;
  /** base64url ciphertext (includes GCM tag) */
  ct: string;
};

export const randomBytes = (length: number): Uint8Array<ArrayBuffer> => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
};

export const toBase64 = (value: Uint8Array | ArrayBuffer): string => {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  let binary = '';
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
};

export const fromBase64 = (value: string): Uint8Array<ArrayBuffer> => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
};

/** Compact base64url, handy for ids. */
export const randomId = (bytes = 12): string =>
  toBase64(randomBytes(bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export const utf8 = (value: string): Uint8Array<ArrayBuffer> =>
  encoder.encode(value) as Uint8Array<ArrayBuffer>;
export const fromUtf8 = (value: Uint8Array | ArrayBuffer): string =>
  decoder.decode(value instanceof Uint8Array ? value : new Uint8Array(value));

export const deriveKey = async (
  passphrase: string,
  salt: string,
  iterations: number,
): Promise<CryptoKey> => {
  const baseKey = await crypto.subtle.importKey('raw', utf8(passphrase), 'PBKDF2', false, [
    'deriveKey',
  ]);
  return crypto.subtle.deriveKey(
    {name: 'PBKDF2', salt: fromBase64(salt), iterations, hash: 'SHA-256'},
    baseKey,
    {name: 'AES-GCM', length: 256},
    false,
    ['encrypt', 'decrypt'],
  );
};

export const createSalt = (): string => toBase64(randomBytes(16));

export const encryptString = async (key: CryptoKey, plaintext: string): Promise<CipherText> => {
  const iv = randomBytes(12);
  const ct = await crypto.subtle.encrypt({name: 'AES-GCM', iv}, key, utf8(plaintext));
  return {iv: toBase64(iv), ct: toBase64(ct)};
};

export const decryptString = async (key: CryptoKey, cipher: CipherText): Promise<string> =>
  fromUtf8(await crypto.subtle.decrypt({name: 'AES-GCM', iv: fromBase64(cipher.iv)}, key, fromBase64(cipher.ct)));

export const encryptBuffer = async (key: CryptoKey, data: ArrayBuffer): Promise<CipherText & {data: Uint8Array}> => {
  const iv = randomBytes(12);
  const encrypted = await crypto.subtle.encrypt({name: 'AES-GCM', iv}, key, data);
  return {iv: toBase64(iv), ct: toBase64(encrypted), data: new Uint8Array(encrypted)};
};

export const decryptBuffer = async (
  key: CryptoKey,
  iv: string,
  ct: ArrayBuffer | Uint8Array<ArrayBufferLike>,
): Promise<ArrayBuffer> => {
  // Copy into a fresh ArrayBuffer-backed view so WebCrypto accepts it (TS 5.9
  // types reject views that might be backed by a SharedArrayBuffer).
  const payload = new Uint8Array(ct);
  return crypto.subtle.decrypt({name: 'AES-GCM', iv: fromBase64(iv)}, key, payload);
};

export const encryptJson = async <T>(key: CryptoKey, value: T): Promise<CipherText> =>
  encryptString(key, JSON.stringify(value));

export const decryptJson = async <T>(key: CryptoKey, cipher: CipherText): Promise<T> =>
  JSON.parse(await decryptString(key, cipher)) as T;

/** Constant-ish comparison for the unlock verifier. */
export const safeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return diff === 0;
};

export const VERIFIER_PAYLOAD = 'hakoniwa-private-garden:v1';

export const makeVerifier = async (key: CryptoKey, payload = VERIFIER_PAYLOAD): Promise<CipherText> =>
  encryptString(key, payload);

export const checkVerifier = async (key: CryptoKey, cipher: CipherText): Promise<boolean> => {
  try {
    return safeEqual(await decryptString(key, cipher), VERIFIER_PAYLOAD);
  } catch {
    return false;
  }
};
