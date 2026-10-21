import {canvasTexture, softGlow, withAlpha} from '../canvas';

/** Soft pool of warm light for painting storefront spill onto pavement. */
export const lightPoolTexture = (color: string, strength = 0.8): ReturnType<typeof canvasTexture> =>
  canvasTexture(`effect/lightPool/${color}/${strength}`, 256, 256, (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    softGlow(ctx, width / 2, height / 2, width * 0.5, withAlpha(color, strength));
    softGlow(ctx, width / 2, height / 2, width * 0.26, withAlpha(color, strength * 0.85));
  }, {sharp: true});

/** Vertical gradient used for window light falling onto a wall or floor. */
export const lightSpillTexture = (color: string, strength = 0.5): ReturnType<typeof canvasTexture> =>
  canvasTexture(`effect/lightSpill/${color}/${strength}`, 128, 256, (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, withAlpha(color, strength));
    gradient.addColorStop(0.55, withAlpha(color, strength * 0.35));
    gradient.addColorStop(1, withAlpha(color, 0));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    const sideFade = ctx.createLinearGradient(0, 0, width, 0);
    sideFade.addColorStop(0, 'rgba(0,0,0,1)');
    sideFade.addColorStop(0.22, 'rgba(0,0,0,0)');
    sideFade.addColorStop(0.78, 'rgba(0,0,0,0)');
    sideFade.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = sideFade;
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
  }, {sharp: true});

/** Soft wet reflection streak that can be stretched along the ground. */
export const reflectionStreakTexture = (color: string, strength = 0.5): ReturnType<typeof canvasTexture> =>
  canvasTexture(`effect/reflection/${color}/${strength}`, 128, 256, (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    const vertical = ctx.createLinearGradient(0, 0, 0, height);
    vertical.addColorStop(0, withAlpha(color, strength));
    vertical.addColorStop(0.4, withAlpha(color, strength * 0.55));
    vertical.addColorStop(1, withAlpha(color, 0));
    ctx.fillStyle = vertical;
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'destination-out';
    for (let index = 0; index < 22; index += 1) {
      const x = (index / 22) * width + Math.sin(index * 2.3) * 6;
      ctx.fillStyle = `rgba(0,0,0,${0.25 + (index % 3) * 0.18})`;
      ctx.fillRect(x, 0, 2 + (index % 4), height);
    }
    ctx.globalCompositeOperation = 'source-over';
  }, {sharp: true});

/** Sheen that sits on top of glass to imply reflection streaks. */
export const glassSheenTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('effect/glassSheen', 256, 256, (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    const diagonal = ctx.createLinearGradient(0, height, width, 0);
    diagonal.addColorStop(0, 'rgba(210, 232, 244, 0)');
    diagonal.addColorStop(0.42, 'rgba(210, 232, 244, 0.14)');
    diagonal.addColorStop(0.5, 'rgba(232, 244, 252, 0.26)');
    diagonal.addColorStop(0.58, 'rgba(210, 232, 244, 0.08)');
    diagonal.addColorStop(1, 'rgba(210, 232, 244, 0)');
    ctx.fillStyle = diagonal;
    ctx.fillRect(0, 0, width, height);
  }, {sharp: true});
