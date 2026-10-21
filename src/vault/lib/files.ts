/** Browser-side helpers for turning picked files into encrypted vault attachments. */

export type PreparedFile = {
  buffer: ArrayBuffer;
  name: string;
  mime: string;
  width?: number;
  height?: number;
};

const MAX_DIMENSION = 1800;
const COMPRESSIBLE = /^image\/(jpeg|png|webp|bmp|avif)$/i;

const readAsArrayBuffer = (blob: Blob): Promise<ArrayBuffer> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error ?? new Error('读取文件失败'));
    reader.readAsArrayBuffer(blob);
  });

const canvasToBlob = (canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('图片压缩失败'))),
      mime,
      quality,
    );
  });

const compressImage = async (file: File): Promise<PreparedFile | null> => {
  if (!COMPRESSIBLE.test(file.type)) return null;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const targetMime = file.type === 'image/png' && scale === 1 ? 'image/png' : 'image/jpeg';
    const quality = targetMime === 'image/png' ? 1 : 0.86;
    const blob = await canvasToBlob(canvas, targetMime, quality);
    if (blob.size >= file.size && scale === 1 && targetMime === 'image/png') {
      return {buffer: await readAsArrayBuffer(file), name: file.name, mime: file.type};
    }
    return {
      buffer: await readAsArrayBuffer(blob),
      name: file.name.replace(/\.(png|webp|bmp|avif)$/i, targetMime === 'image/jpeg' ? '.jpg' : '.png'),
      mime: targetMime,
      width,
      height,
    };
  } catch {
    return null;
  }
};

export const prepareFile = async (file: File): Promise<PreparedFile> => {
  const image = await compressImage(file);
  if (image) return image;
  return {buffer: await readAsArrayBuffer(file), name: file.name, mime: file.type || 'application/octet-stream'};
};

export const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
  const response = await fetch(dataUrl);
  return response.blob();
};

export const base64ToBlob = (base64: string, mime: string): Blob => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], {type: mime || 'application/octet-stream'});
};

export const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('读取文件失败'));
    reader.readAsDataURL(blob);
  });
