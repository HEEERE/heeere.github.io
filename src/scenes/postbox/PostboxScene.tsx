import {useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {Color, MathUtils, type Group, type PointLight} from 'three';
import {Html} from '@react-three/drei';
import {useExperience} from '../../experience/Experience';
import {useQuality} from '../../three/quality';
import {profile} from '../../data/profile';
import {DioramaBase} from '../../three/kit/DioramaBase';
import {
  Box,
  Cable,
  ContactShadow,
  Cyl,
  Glow,
  GrassTuft,
  LightCone,
  Panel,
  Plant,
  RBox,
  Sphere,
  Torus,
} from '../../three/kit/primitives';
import {NightExteriorLights} from '../../three/kit/lighting';
import {Rain, Ripples, Steam} from '../../three/kit/rain';
import {
  canvasTexture,
  FONT_MONO,
  FONT_SANS,
  FONT_SERIF,
  grain,
  rng,
  softGlow,
  text,
  withAlpha,
} from '../../three/canvas';
import {
  deskWoodTexture,
  glassSheenTexture,
  lightPoolTexture,
  phoneBoothInteriorTexture,
  phoneBoothSignTexture,
  postboxFrontTexture,
  reflectionStreakTexture,
  streetPlateTexture,
  wetSheenTexture,
} from '../../three/textures';
import {flat, glass, toon} from '../../three/materials';
import {getScene} from '../../data/scenes';

/* ------------------------------------------------------------------ */
/* Local painted textures                                              */
/* ------------------------------------------------------------------ */

/** Stone paving corner, road edge, tactile strip and standing water. */
const postboxGround = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('scene/postbox/ground', 2048, 2048, (ctx, width, height) => {
    const scale = width / 4.6;
    const px = (x: number) => (x + 2.3) * scale;
    const py = (z: number) => (z + 2.3) * scale;
    const random = rng(604);

    ctx.fillStyle = '#5b656d';
    ctx.fillRect(0, 0, width, height);

    // Asphalt lane along the right edge of the plinth.
    ctx.fillStyle = '#353d44';
    ctx.fillRect(px(1.4), 0, width - px(1.4), height);
    for (let index = 0; index < 9000; index += 1) {
      ctx.fillStyle = random() > 0.5 ? 'rgba(150, 160, 168, 0.05)' : 'rgba(8, 10, 12, 0.09)';
      ctx.fillRect(px(1.4) + random() * (width - px(1.4)), random() * height, 1 + random() * 4, 1 + random() * 4);
    }

    // Paving slabs.
    let row = 0;
    for (let z = -2.34; z < 2.34; z += 0.44) {
      const offset = (row % 2) * 0.31;
      for (let x = -2.36 - offset; x < 1.2; x += 0.62) {
        const shade = 94 + random() * 26;
        ctx.fillStyle = `rgb(${shade}, ${shade + 6}, ${shade + 10})`;
        ctx.fillRect(px(x) + 2, py(z) + 2, 0.585 * scale, 0.405 * scale);
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(px(x) + 2, py(z) + 2, 0.585 * scale, 2);
        ctx.fillStyle = 'rgba(10, 14, 18, 0.04)';
        ctx.fillRect(px(x) + 2, py(z) + 4, 0.585 * scale, 0.405 * scale * 0.45);
      }
      row += 1;
    }

    // Wet patches over the paving.
    for (let index = 0; index < 34; index += 1) {
      ctx.fillStyle = `rgba(24, 32, 40, ${0.05 + random() * 0.08})`;
      ctx.beginPath();
      ctx.ellipse(random() * px(1.2), random() * height, 20 + random() * 110, 8 + random() * 42, random() * 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Tactile paving strip following the curb.
    for (let z = -1.9; z < 1.9; z += 0.15) {
      for (let column = 0; column < 2; column += 1) {
        const x = 1.16 + column * 0.15;
        ctx.fillStyle = 'rgba(206, 176, 92, 0.34)';
        ctx.fillRect(px(x), py(z), 0.13 * scale, 0.12 * scale);
        ctx.fillStyle = 'rgba(232, 204, 128, 0.4)';
        for (let dot = 0; dot < 4; dot += 1) {
          ctx.beginPath();
          ctx.arc(px(x) + (0.035 + (dot % 2) * 0.06) * scale, py(z) + (0.035 + Math.floor(dot / 2) * 0.05) * scale, 0.008 * scale, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Gutter, curb and road edge line.
    ctx.fillStyle = 'rgba(16, 20, 24, 0.55)';
    ctx.fillRect(px(1.32), 0, 0.09 * scale, height);
    ctx.fillStyle = '#8a9297';
    ctx.fillRect(px(1.39), 0, 0.06 * scale, height);
    ctx.fillStyle = 'rgba(238, 240, 232, 0.26)';
    ctx.fillRect(px(1.63), 0, 0.025 * scale, height);
    ctx.fillStyle = 'rgba(238, 240, 232, 0.2)';
    for (let z = -2.2; z < 2.3; z += 0.9) ctx.fillRect(px(2.12), py(z), 0.02 * scale, 0.42 * scale);

    // Manhole in the lane.
    ctx.save();
    ctx.translate(px(1.86), py(1.32));
    ctx.fillStyle = 'rgba(26, 30, 34, 0.92)';
    ctx.beginPath();
    ctx.arc(0, 0, 0.23 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(150, 158, 162, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 0.2 * scale, 0, Math.PI * 2);
    ctx.stroke();
    for (let index = 0; index < 10; index += 1) {
      ctx.beginPath();
      ctx.arc(0, 0, 0.2 * scale, (index / 10) * Math.PI * 2, (index / 10 + 0.4) * Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // Drain at the curb.
    ctx.fillStyle = 'rgba(12, 15, 18, 0.85)';
    ctx.fillRect(px(1.3), py(0.34), 0.2 * scale, 0.34 * scale);
    ctx.fillStyle = 'rgba(150, 158, 158, 0.35)';
    for (let index = 0; index < 6; index += 1) {
      ctx.fillRect(px(1.31), py(0.36 + index * 0.05), 0.18 * scale, 0.012 * scale);
    }

    // Puddles.
    const puddle = (x: number, z: number, rx: number, rz: number, depth: number) => {
      ctx.save();
      ctx.translate(px(x), py(z));
      ctx.scale(1, rz / rx);
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, rx * scale);
      gradient.addColorStop(0, `rgba(16, 24, 32, ${depth})`);
      gradient.addColorStop(0.62, `rgba(24, 34, 44, ${depth * 0.72})`);
      gradient.addColorStop(1, 'rgba(34, 44, 52, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, rx * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(158, 184, 196, 0.12)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, rx * scale * 0.82, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    };
    puddle(-0.34, 1.52, 0.62, 0.26, 0.85);
    puddle(0.78, 1.06, 0.4, 0.2, 0.7);
    puddle(-1.52, 0.58, 0.48, 0.3, 0.6);
    puddle(0.18, -0.34, 0.3, 0.17, 0.55);
    puddle(1.78, 0.62, 0.28, 0.52, 0.6);
    puddle(1.98, -0.78, 0.22, 0.34, 0.5);

    // Reflections painted into the wet ground.
    const reflect = (x: number, z: number, w: number, d: number, color: string, strength: number) => {
      const gradient = ctx.createLinearGradient(0, py(z), 0, py(z + d));
      gradient.addColorStop(0, withAlpha(color, strength));
      gradient.addColorStop(0.45, withAlpha(color, strength * 0.55));
      gradient.addColorStop(1, withAlpha(color, 0));
      ctx.fillStyle = gradient;
      ctx.fillRect(px(x - w / 2), py(z), w * scale, d * scale);
    };
    reflect(-0.5, 0.7, 0.36, 1.05, '#ff5a3a', 0.28);
    reflect(-0.5, 0.95, 0.18, 0.65, '#ff8a5a', 0.24);
    reflect(-1.36, 0.05, 0.46, 1.25, '#ffc884', 0.26);
    reflect(-1.05, 0.2, 0.26, 0.8, '#ffb870', 0.18);
    reflect(1.05, 0.08, 0.52, 1.1, '#ffcf9a', 0.18);
    reflect(-0.3, -0.1, 0.5, 0.8, '#7f9fbf', 0.1);

    // Fallen leaves and grit.
    for (let index = 0; index < 48; index += 1) {
      ctx.fillStyle = random() > 0.55 ? 'rgba(120, 96, 58, 0.5)' : 'rgba(70, 86, 62, 0.45)';
      ctx.beginPath();
      ctx.ellipse(px(-2.1 + random() * 3.4), py(-1.9 + random() * 3.8), 2 + random() * 3, 1 + random() * 2, random() * 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Darker edge of the plinth.
    ctx.fillStyle = 'rgba(10, 14, 18, 0.22)';
    ctx.fillRect(0, 0, width, 10);
    ctx.fillRect(0, height - 10, width, 10);
    ctx.fillRect(0, 0, 10, height);
    ctx.fillRect(width - 10, 0, 10, height);
    grain(ctx, width, height, {seed: 12, count: 4200, alpha: 0.05, size: 1.4, colors: ['#ffffff', '#20282e']});
  });

/** Small ceramic facade tiles for the corner building. */
const tileFacade = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('scene/postbox/facade', 512, 512, (ctx, width, height) => {
    ctx.fillStyle = '#8f938c';
    ctx.fillRect(0, 0, width, height);
    const random = rng(712);
    const tileWidth = 64;
    const tileHeight = 44;
    for (let row = 0; row < Math.ceil(height / tileHeight); row += 1) {
      for (let column = -1; column < Math.ceil(width / tileWidth) + 1; column += 1) {
        const x = column * tileWidth + (row % 2) * (tileWidth / 2);
        const y = row * tileHeight;
        const shade = 142 + random() * 20;
        ctx.fillStyle = `rgb(${shade}, ${shade + 3}, ${shade - 2})`;
        ctx.fillRect(x + 2, y + 2, tileWidth - 3, tileHeight - 3);
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(x + 2, y + 2, tileWidth - 3, 2);
      }
    }
    // Damp streaks and grime.
    for (let index = 0; index < 20; index += 1) {
      const x = random() * width;
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, 'rgba(50, 58, 58, 0.22)');
      gradient.addColorStop(0.6, 'rgba(50, 58, 58, 0.06)');
      gradient.addColorStop(1, 'rgba(50, 58, 58, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(x, 0, 3 + random() * 12, height);
    }
    ctx.fillStyle = 'rgba(28, 34, 36, 0.3)';
    ctx.fillRect(0, height - 34, width, 34);
    grain(ctx, width, height, {seed: 5, count: 1800, alpha: 0.05, size: 1.4});
  });

/** Warm window seen through a curtain. */
const warmWindow = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('scene/postbox/window', 256, 320, (ctx, width, height) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#ffd8a0');
    gradient.addColorStop(0.55, '#e8a868');
    gradient.addColorStop(1, '#b87a4a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    // Blinds.
    ctx.fillStyle = 'rgba(246, 226, 196, 0.55)';
    for (let y = 8; y < 98; y += 12) ctx.fillRect(0, y, width, 5);
    // Curtains.
    ctx.fillStyle = 'rgba(242, 218, 186, 0.8)';
    ctx.fillRect(0, 0, 42, height);
    ctx.fillRect(width - 46, 0, 46, height);
    ctx.fillStyle = 'rgba(168, 118, 78, 0.25)';
    for (let index = 0; index < 4; index += 1) {
      ctx.fillRect(8 + index * 9, 0, 3, height);
      ctx.fillRect(width - 40 + index * 9, 0, 3, height);
    }
    // A lamp and a plant on the sill.
    ctx.fillStyle = 'rgba(90, 58, 36, 0.35)';
    ctx.fillRect(96, 158, 68, 6);
    ctx.fillRect(122, 128, 4, 32);
    ctx.beginPath();
    ctx.arc(124, 152, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(70, 96, 62, 0.6)';
    ctx.beginPath();
    ctx.ellipse(88, 234, 22, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(184, 246, 18, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    // Window mullions.
    ctx.fillStyle = 'rgba(46, 38, 32, 0.75)';
    ctx.fillRect(width / 2 - 3, 0, 6, height);
    ctx.fillRect(0, height / 2 - 3, width, 6);
    softGlow(ctx, width / 2, height * 0.35, 110, 'rgba(255, 226, 170, 0.35)');
  });

/** Little café light box above the building door. */
const shopSign = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('scene/postbox/shopSign', 512, 160, (ctx, width, height) => {
    ctx.fillStyle = '#1e352b';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = withAlpha('#e8d8b0', 0.5);
    ctx.lineWidth = 3;
    ctx.strokeRect(6, 6, width - 12, height - 12);
    ctx.save();
    ctx.shadowColor = '#ffdca8';
    ctx.shadowBlur = 16;
    text(ctx, '喫茶 海風', 28, 86, {size: 56, weight: 700, font: FONT_SERIF, color: '#f4e6c8'});
    ctx.restore();
    text(ctx, 'KAI FENG / COFFEE', 30, 126, {size: 17, weight: 700, font: FONT_MONO, color: '#c8b48c', tracking: 3});
    // Cup icon.
    ctx.strokeStyle = '#e8d8b0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(width - 68, 58, 21, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(width - 42, 58, 11, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(232, 216, 176, 0.25)';
    ctx.fillRect(width - 89, 83, 42, 4);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(0, 0, width, 8);
  });

/** Metal direction plates for EMAIL / GITHUB / RESUME. */
const directionPlate = (label: string, sub: string, color: string, icon: 'mail' | 'code' | 'file', direction: 'left' | 'right'): ReturnType<typeof canvasTexture> =>
  canvasTexture(`scene/postbox/plate/${label}`, 512, 140, (ctx, width, height) => {
    ctx.fillStyle = '#e9e7db';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(30, 38, 40, 0.18)';
    ctx.fillRect(0, 0, width, 5);
    ctx.fillRect(0, height - 5, width, 5);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 104, height);
    // Simple icon inside the colour block.
    ctx.strokeStyle = '#f6f2e6';
    ctx.fillStyle = '#f6f2e6';
    ctx.lineWidth = 5;
    if (icon === 'mail') {
      ctx.strokeRect(28, 46, 48, 34);
      ctx.beginPath();
      ctx.moveTo(28, 48);
      ctx.lineTo(52, 66);
      ctx.lineTo(76, 48);
      ctx.stroke();
    } else if (icon === 'code') {
      ctx.beginPath();
      ctx.moveTo(42, 44);
      ctx.lineTo(26, 68);
      ctx.lineTo(42, 92);
      ctx.moveTo(62, 44);
      ctx.lineTo(78, 68);
      ctx.lineTo(62, 92);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(57, 38);
      ctx.lineTo(47, 98);
      ctx.stroke();
    } else {
      ctx.strokeRect(32, 36, 40, 64);
      ctx.fillStyle = color;
      ctx.fillRect(38, 50, 28, 3);
      ctx.fillRect(38, 62, 28, 3);
      ctx.fillRect(38, 74, 20, 3);
      ctx.fillStyle = '#f6f2e6';
      ctx.fillRect(38, 84, 18, 10);
    }
    text(ctx, label, 128, 66, {size: 44, weight: 800, font: FONT_SANS, color: '#283438', tracking: 3});
    text(ctx, sub, 130, 102, {size: 20, weight: 500, font: FONT_SANS, color: '#5f6c6c'});
    // Direction arrow.
    const arrowX = direction === 'right' ? width - 62 : 62;
    ctx.fillStyle = '#283438';
    ctx.save();
    ctx.translate(arrowX, 70);
    if (direction === 'left') ctx.scale(-1, 1);
    ctx.beginPath();
    ctx.moveTo(-22, 0);
    ctx.lineTo(4, -16);
    ctx.lineTo(4, -6);
    ctx.lineTo(24, -6);
    ctx.lineTo(24, 6);
    ctx.lineTo(4, 6);
    ctx.lineTo(4, 16);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(54, 64, 66, 0.35)';
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, width - 4, height - 4);
    grain(ctx, width, height, {seed: 31, count: 400, alpha: 0.05, size: 1});
  });

/* ------------------------------------------------------------------ */
/* Postbox                                                             */
/* ------------------------------------------------------------------ */

const Postbox = () => {
  const {contactWarm, setContactWarm} = useExperience();
  const quality = useQuality();
  const flap = useRef<Group>(null);
  useFrame((_, delta) => {
    if (flap.current) flap.current.rotation.x = quality.reducedMotion ? (contactWarm ? -.4 : 0) : MathUtils.damp(flap.current.rotation.x, contactWarm ? -.4 : 0, 5, delta);
  });
  return <group name="street-mailbox" position={[-0.5, 0, 0.45]} rotation={[0, 0.34, 0]}
    onPointerOver={() => setContactWarm(true)} onPointerOut={() => setContactWarm(false)}
    onClick={event => { if (quality.tier === 'exhibit' && event.delta < 6) { event.stopPropagation(); window.location.href = `mailto:${profile.email}`; } }}>
    <ContactShadow p={[0, 0, 0]} radius={0.4} opacity={0.4} />
    <Cyl radius={0.27} height={0.04} segments={24} color="#7f8a8d" p={[0, 0.02, 0]} ink={false} />
    <Cyl radius={0.21} height={0.17} segments={24} color="#7f2a20" p={[0, 0.105, 0]} ink={false} />
    <Cyl radius={0.225} height={0.025} segments={24} color="#a03224" p={[0, 0.195, 0]} ink={false} shadow={false} />
    <RBox size={[0.4, 0.72, 0.36]} radius={0.13} segments={4} color="#b83a28" p={[0, 0.555, 0]} ink inkWidth={0.008} />
    <Sphere radius={0.205} s={[1, 0.62, 0.92]} color="#c04430" p={[0, 0.895, 0]} ink inkWidth={0.008} />
    <Torus radius={0.19} tube={0.012} color="#9a3024" r={[Math.PI / 2, 0, 0]} p={[0, 0.885, 0]} ink={false} shadow={false} />
    <Cyl radius={0.026} height={0.035} color="#d8b070" p={[0, 0.99, 0]} ink={false} shadow={false} />
    {/* Front plate texture + slot shadow. */}
    <Box size={[0.33, 0.64, 0.012]} color="#9a3024" p={[0, 0.57, 0.179]} ink={false} shadow={false} />
    <Panel size={[0.31, 0.6]} texture={postboxFrontTexture()} lit p={[0, 0.57, 0.189]} />
    <Box size={[0.19, 0.022, 0.028]} color="#6f2a20" p={[0, 0.688, 0.194]} ink={false} shadow={false} />
    <Box size={[0.16, 0.008, 0.012]} color="#3a2018" p={[0, 0.682, 0.207]} ink={false} shadow={false} />
    <group ref={flap} name="mail-slot-flap" position={[0, .7, .215]}><Box size={[.18, .035, .008]} color="#a85437" p={[0, -.017, 0]} ink={false} /></group>
    {quality.tier === 'exhibit' ? <Html position={[0, 1.16, .12]} center wrapperClass="scene-detail-anchor" zIndexRange={[4, 2]}><a className="scene-mail" href={`mailto:${profile.email}`} onFocus={() => setContactWarm(true)} onBlur={() => setContactWarm(false)} onPointerDown={event => event.stopPropagation()} onClick={event => event.stopPropagation()}>写一封信 ↗</a></Html> : null}
    {/* Side bolt heads. */}
    <Cyl radius={0.012} height={0.012} color="#d8b070" r={[0, 0, Math.PI / 2]} p={[0.2, 0.44, 0.02]} ink={false} shadow={false} />
    <Cyl radius={0.012} height={0.012} color="#d8b070" r={[0, 0, Math.PI / 2]} p={[0.2, 0.44, -0.05]} ink={false} shadow={false} />
  </group>;
};

const DroppedMail = () => (
  <group>
    <Box size={[0.19, 0.008, 0.12]} color="#f1ece0" p={[-0.28, 0.006, 0.9]} r={[0, 0.42, 0]} ink={false} shadow={false} />
    <Box size={[0.16, 0.007, 0.1]} color="#e6dfce" p={[-0.37, 0.011, 0.94]} r={[0, -0.2, 0]} ink={false} shadow={false} />
    <Box size={[0.04, 0.004, 0.03]} color="#b8402f" p={[-0.28, 0.011, 0.9]} r={[0, 0.42, 0]} ink={false} shadow={false} />
  </group>
);

const Parcel = () => (
  <group position={[-1.0, 0, 0.9]} rotation={[0, 0.42, 0]}>
    <RBox size={[0.3, 0.22, 0.24]} radius={0.006} color="#b79a72" p={[0, 0.11, 0]} ink={false} />
    <Box size={[0.3, 0.012, 0.04]} color="#d8c8ac" p={[0, 0.212, 0]} ink={false} shadow={false} />
    <Box size={[0.04, 0.012, 0.24]} color="#d8c8ac" p={[0, 0.213, 0]} ink={false} shadow={false} />
    <Box size={[0.13, 0.08, 0.004]} color="#f0e8d6" p={[0.05, 0.15, 0.123]} ink={false} shadow={false} />
    <Box size={[0.08, 0.03, 0.003]} color="#b8402f" p={[0.05, 0.16, 0.126]} ink={false} shadow={false} />
    <Box size={[0.17, 0.012, 0.1]} color="#efe9da" p={[0.02, 0.228, -0.02]} r={[0, 0.3, 0]} ink={false} shadow={false} />
  </group>
);

/* ------------------------------------------------------------------ */
/* Phone booth                                                         */
/* ------------------------------------------------------------------ */

const PhoneBooth = () => {
  const light = useRef<PointLight>(null);
  const signGlow = useRef<PointLight>(null);

  useFrame(({clock}) => {
    const time = clock.elapsedTime;
    if (light.current) light.current.intensity = 1.15 + Math.sin(time * 0.62) * 0.08;
    if (signGlow.current) signGlow.current.intensity = 0.4 + Math.sin(time * 0.9 + 1.4) * 0.03;
  });

  return (
    <group position={[-1.38, 0, -0.62]} rotation={[0, 0.3, 0]}>
      <ContactShadow p={[0, 0, 0]} radius={0.55} opacity={0.35} />
      <RBox size={[0.8, 0.05, 0.72]} radius={0.006} color="#6f7a7c" p={[0, 0.025, 0]} ink={false} />
      <Panel size={[0.56, 0.46]} material={toon('#c8bca6')} lit r={[-Math.PI / 2, 0, 0]} p={[0, 0.053, -0.02]} />
      {/* Frame posts. */}
      {[-0.3, 0.3].map((x) => (
        <group key={x}>
          <Box size={[0.05, 1.42, 0.05]} color="#3d564a" p={[x, 0.75, 0.25]} ink={false} />
          <Box size={[0.05, 1.42, 0.05]} color="#3d564a" p={[x, 0.75, -0.25]} ink={false} />
        </group>
      ))}
      {/* Glass. */}
      <Panel size={[0.5, 1.26]} material={glass('#cfe4dc', 0.16)} r={[0, Math.PI / 2, 0]} p={[-0.305, 0.75, 0]} />
      <Panel size={[0.5, 1.26]} material={glass('#cfe4dc', 0.16)} r={[0, Math.PI / 2, 0]} p={[0.305, 0.75, 0]} />
      <Panel size={[0.56, 1.26]} material={glass('#cfe4dc', 0.16)} p={[0, 0.75, -0.255]} />
      {/* Interior back panel with the phone and instructions. */}
      <Panel size={[0.5, 1.3]} texture={phoneBoothInteriorTexture()} p={[0, 0.79, -0.235]} />
      <Panel
        size={[0.5, 1.3]}
        material={flat('#ffcf9a', {map: phoneBoothInteriorTexture(), transparent: true, opacity: 0.3})}
        p={[0, 0.79, -0.232]}
      />
      {/* Roof + light box sign. */}
      <RBox size={[0.72, 0.09, 0.66]} radius={0.008} color="#3d564a" p={[0, 1.5, 0]} ink inkWidth={0.006} />
      <Box size={[0.76, 0.028, 0.7]} color="#5f7466" p={[0, 1.557, 0]} ink={false} shadow={false} />
      <RBox size={[0.6, 0.2, 0.1]} radius={0.01} color="#1f3a2e" p={[0, 1.33, 0.28]} ink inkWidth={0.005} />
      <Panel size={[0.56, 0.17]} texture={phoneBoothSignTexture()} p={[0, 1.33, 0.333]} />
      <Panel size={[0.09, 0.17]} texture={phoneBoothSignTexture()} r={[0, Math.PI / 2, 0]} p={[0.303, 1.33, 0.28]} />
      <Box size={[0.6, 0.04, 0.05]} color="#3d564a" p={[0, 1.25, 0.25]} ink={false} shadow={false} />
      <Box size={[0.6, 0.04, 0.05]} color="#3d564a" p={[0, 0.09, 0.25]} ink={false} shadow={false} />
      {/* Door, swung a little open. */}
      <group position={[0.28, 0, 0.25]} rotation={[0, 0.42, 0]}>
        <Panel size={[0.5, 1.14]} material={glass('#d8ece4', 0.18)} p={[-0.25, 0.69, 0]} />
        <Box size={[0.52, 0.035, 0.03]} color="#3d564a" p={[-0.25, 1.27, 0]} ink={false} shadow={false} />
        <Box size={[0.52, 0.035, 0.03]} color="#3d564a" p={[-0.25, 0.11, 0]} ink={false} shadow={false} />
        <Box size={[0.035, 1.2, 0.03]} color="#3d564a" p={[-0.51, 0.69, 0]} ink={false} shadow={false} />
        <Box size={[0.02, 0.14, 0.03]} color="#c8b48c" p={[-0.46, 0.7, 0.035]} ink={false} shadow={false} />
      </group>
      {/* Glass sheen on the fixed side pane. */}
      <Panel size={[0.46, 1.2]} texture={glassSheenTexture()} additive opacity={0.28} r={[0, Math.PI / 2, 0]} p={[0.312, 0.75, 0]} />
      {/* Interior light. */}
      <Box size={[0.36, 0.02, 0.26]} color="#ffe8c0" material={flat('#ffe8c0')} p={[0, 1.44, -0.02]} ink={false} shadow={false} />
      <Glow color="#ffd29a" size={0.85} opacity={0.24} p={[0, 1.1, 0.22]} />
      <Glow color="#ffc27a" size={0.6} opacity={0.14} p={[0, 0.6, 0.16]} />
      <pointLight ref={light} position={[0, 1.16, -0.02]} color="#ffd6a0" intensity={0.9} distance={1.9} decay={2} />
      <pointLight ref={signGlow} position={[0, 1.33, 0.36]} color="#cfe8d0" intensity={0.32} distance={0.9} decay={2} />
    </group>
  );
};

/* ------------------------------------------------------------------ */
/* Street lamp                                                         */
/* ------------------------------------------------------------------ */

const StreetLamp = () => {
  const light = useRef<PointLight>(null);
  const {contactWarm} = useExperience();
  const quality = useQuality();
  const colors = useRef([new Color('#ffd6a0'), new Color('#ffc078')]);
  const warmth = useRef(0);
  useFrame(({clock}, delta) => {
    if (!light.current) return;
    const time = clock.elapsedTime;
    const flicker = quality.reducedMotion ? 0 : Math.sin(time * 1.1) * 0.03;
    warmth.current = quality.reducedMotion ? Number(contactWarm) : MathUtils.damp(warmth.current, Number(contactWarm), 3, delta);
    light.current.intensity = 3.5 + warmth.current * .65 + flicker;
    light.current.color.lerpColors(colors.current[0]!, colors.current[1]!, warmth.current);
  });
  return (
    <group position={[1.5, 0, -0.4]}>
      <ContactShadow p={[0, 0, 0]} radius={0.3} opacity={0.34} />
      <Cyl radius={0.09} height={0.09} segments={14} color="#465354" p={[0, 0.045, 0]} ink={false} />
      <Cyl radius={0.028} height={1.66} segments={12} color="#4f5d5e" p={[0, 0.88, 0]} ink={false} />
      <Cyl radius={0.05} height={0.07} color="#3d4a4c" p={[0, 0.14, 0]} ink={false} shadow={false} />
      <Cable points={[[0, 1.7, 0], [0.02, 1.78, -0.05], [-0.18, 1.79, -0.08], [-0.36, 1.72, -0.06], [-0.42, 1.64, -0.04]]} radius={0.017} color="#465354" />
      {/* Globe lantern under a small hood. */}
      <Cyl radius={0.11} radiusTop={0.07} height={0.07} color="#3d4a4c" p={[-0.42, 1.66, -0.04]} ink={false} />
      <Sphere radius={0.092} color="#ffd79e" material={flat('#ffd79e')} p={[-0.42, 1.585, -0.04]} ink={false} shadow={false} />
      <Torus radius={0.098} tube={0.008} color="#3d4a4c" r={[Math.PI / 2, 0, 0]} p={[-0.42, 1.6, -0.04]} ink={false} shadow={false} />
      <Glow color="#ffd9a0" size={1.15} opacity={0.3} p={[-0.42, 1.58, -0.04]} />
      <LightCone color="#ffd8a0" height={1.5} radiusTop={0.05} radiusBottom={0.72} opacity={0.085} p={[-0.42, 1.57, -0.04]} />
      <pointLight ref={light} position={[-0.42, 1.56, -0.02]} color="#ffd6a0" intensity={3.5} distance={5.0} decay={2} />
    </group>
  );
};

/* ------------------------------------------------------------------ */
/* Signpost                                                            */
/* ------------------------------------------------------------------ */

const DirectionPlate = ({
  y,
  yaw,
  texture,
}: {
  y: number;
  yaw: number;
  texture: ReturnType<typeof canvasTexture>;
}) => (
  <group position={[0.02, y, 0]} rotation={[0, yaw, 0]}>
    <RBox size={[0.46, 0.12, 0.024]} radius={0.008} color="#364244" p={[0.21, 0, 0]} ink inkWidth={0.004} />
    <Panel size={[0.44, 0.1]} texture={texture} p={[0.21, 0, 0.014]} />
    <Box size={[0.05, 0.035, 0.05]} color="#5f7070" p={[0.01, 0, -0.004]} ink={false} shadow={false} />
  </group>
);

const Signpost = () => (
  <group position={[0.62, 0, 1.14]}>
    <ContactShadow p={[0, 0, 0]} radius={0.26} opacity={0.3} />
    <Cyl radius={0.085} height={0.08} segments={14} color="#465354" p={[0, 0.04, 0]} ink={false} />
    <Cyl radius={0.026} height={1.52} segments={12} color="#3f4c4e" p={[0, 0.8, 0]} ink={false} />
    <Sphere radius={0.045} color="#b9995e" p={[0, 1.58, 0]} ink={false} shadow={false} />
    <Panel size={[0.34, 0.115]} texture={streetPlateTexture()} p={[0, 0.58, 0.028]} />
    <Box size={[0.36, 0.13, 0.012]} color="#2f5f4a" p={[0, 0.58, 0.018]} ink={false} shadow={false} />
    <DirectionPlate y={1.39} yaw={0.5} texture={directionPlate('EMAIL', 'write to me', '#2f7f74', 'mail', 'left')} />
    <DirectionPlate y={1.21} yaw={0.43} texture={directionPlate('GITHUB', 'source code', '#3d4a5a', 'code', 'right')} />
    <DirectionPlate y={1.03} yaw={0.56} texture={directionPlate('RESUME', 'cv / pdf', '#8a5f4a', 'file', 'right')} />
  </group>
);

/* ------------------------------------------------------------------ */
/* Bench, hedge, building, pole                                        */
/* ------------------------------------------------------------------ */

const Bench = () => {
  const wood = toon('#6f5d4a', {map: deskWoodTexture()});
  return (
    <group position={[1.22, 0, 0.8]} rotation={[0, -Math.PI / 2, 0]}>
      <ContactShadow p={[0, 0, 0]} radius={0.5} opacity={0.34} />
      {[-0.1, -0.02, 0.06, 0.14].map((z) => (
        <Box key={z} size={[0.95, 0.028, 0.07]} material={wood} p={[0, 0.43, z]} ink={false} />
      ))}
      {[0.58, 0.69, 0.8].map((y, index) => (
        <Box key={y} size={[0.95, 0.07, 0.028]} material={wood} p={[0, y, -0.18 + index * 0.02]} r={[0.1, 0, 0]} ink={false} />
      ))}
      {[-0.44, 0.44].map((x) => (
        <group key={x}>
          <Box size={[0.045, 0.4, 0.34]} color="#3c4849" p={[x, 0.22, 0]} ink={false} />
          <Box size={[0.045, 0.42, 0.045]} color="#3c4849" p={[x, 0.62, -0.19]} r={[0.08, 0, 0]} ink={false} />
          <Box size={[0.055, 0.025, 0.34]} color="#3c4849" p={[x, 0.62, 0.02]} ink={false} shadow={false} />
        </group>
      ))}
      {/* Newspaper left on the seat. */}
      <Box size={[0.28, 0.008, 0.2]} color="#e8e4d6" p={[0.12, 0.452, 0.02]} r={[0, 0.18, 0]} ink={false} shadow={false} />
      <Box size={[0.24, 0.006, 0.16]} color="#d6d0c0" p={[0.14, 0.46, 0.03]} r={[0, 0.35, 0]} ink={false} shadow={false} />
    </group>
  );
};

const Hedge = () => (
  <group>
    <RBox size={[2.0, 0.26, 0.4]} radius={0.01} color="#6b7478" p={[0.42, 0.13, -1.9]} ink={false} />
    <Box size={[2.04, 0.05, 0.44]} color="#828b8d" p={[0.42, 0.27, -1.9]} ink={false} shadow={false} />
    <RBox size={[1.92, 0.46, 0.36]} radius={0.12} segments={3} color="#40584a" p={[0.42, 0.53, -1.94]} ink inkWidth={0.006} />
    {([
      [-0.38, 0.72, -1.86, 0.19],
      [0.02, 0.78, -1.9, 0.22],
      [0.46, 0.74, -1.88, 0.2],
      [0.9, 0.7, -1.92, 0.18],
      [1.22, 0.66, -1.88, 0.16],
      [-0.16, 0.66, -1.78, 0.14],
      [0.7, 0.63, -1.78, 0.13],
    ] as const).map(([x, y, z, r], index) => (
      <Sphere
        key={index}
        radius={r}
        color={index % 3 === 0 ? '#4a6a54' : index % 3 === 1 ? '#3f5f4c' : '#46654f'}
        p={[x, y, z]}
        s={[1.15, 0.9, 1]}
        ink={false}
        shadow={false}
      />
    ))}
    <GrassTuft p={[-0.42, 0, -1.68]} scale={1.1} color="#4f6b4a" />
    <GrassTuft p={[1.34, 0, -1.7]} scale={0.9} color="#4a6547" />
  </group>
);

const CornerBuilding = () => (
  <group>
    <RBox size={[1.78, 1.98, 0.34]} radius={0.006} segments={2} material={toon('#a3a59b', {map: tileFacade()})} p={[-1.4, 0.99, -2.12]} ink inkWidth={0.01} />
    {/* Eaves and tiled roof line. */}
    <Box size={[1.9, 0.07, 0.46]} color="#3d4648" p={[-1.4, 2.01, -2.05]} ink={false} />
    <Box size={[1.9, 0.06, 0.4]} color="#4a5152" p={[-1.4, 2.08, -2.14]} r={[0.16, 0, 0]} ink={false} />
    <Cyl radius={0.025} height={2.12} color="#5c6566" p={[-0.56, 0.95, -1.94]} ink={false} shadow={false} />
    <Cyl radius={0.018} height={1.72} color="#5c6566" p={[-2.25, 0.86, -1.94]} ink={false} shadow={false} />
    {/* Upper-floor warm window above the café. */}
    <Box size={[0.56, 0.5, 0.06]} color="#4a4a44" p={[-1.02, 1.72, -1.95]} ink={false} />
    <Panel size={[0.34, 0.42]} texture={warmWindow()} p={[-1.02, 1.72, -1.915]} />
    <Box size={[0.5, 0.035, 0.14]} color="#767a72" p={[-1.02, 1.46, -1.9]} ink={false} shadow={false} />
    <Box size={[0.64, 0.045, 0.2]} color="#3d4648" p={[-1.02, 1.98, -1.97]} ink={false} shadow={false} />
    <Glow color="#ffcf94" size={1.2} opacity={0.14} p={[-1.02, 1.7, -1.8]} />
    <pointLight position={[-1.02, 1.64, -1.7]} color="#ffca8e" intensity={0.55} distance={2.1} decay={2} />
    {/* Dark upper window on the left. */}
    <Box size={[0.46, 0.46, 0.04]} color="#4a4a44" p={[-2.0, 1.62, -1.95]} ink={false} />
    <Box size={[0.38, 0.38, 0.02]} material={glass('#5f7f9a', 0.35)} p={[-2.0, 1.62, -1.925]} ink={false} shadow={false} />
    <Box size={[0.52, 0.03, 0.1]} color="#767a72" p={[-2.0, 1.39, -1.9]} ink={false} shadow={false} />
    {/* Door and café sign. */}
    <Box size={[0.56, 1.04, 0.05]} color="#3f4440" p={[-0.86, 0.53, -1.94]} ink={false} />
    <Box size={[0.4, 0.5, 0.02]} color="#8f9c8c" material={glass('#e8d8b8', 0.45)} p={[-0.86, 0.78, -1.91]} ink={false} />
    <Box size={[0.4, 0.42, 0.03]} color="#5f5448" p={[-0.86, 0.3, -1.92]} ink={false} />
    <Cyl radius={0.012} height={0.1} color="#b9995e" r={[0, 0, Math.PI / 2]} p={[-0.66, 0.55, -1.88]} ink={false} shadow={false} />
    <RBox size={[0.66, 0.2, 0.09]} radius={0.01} color="#1f3a2e" p={[-0.86, 1.36, -1.9]} ink inkWidth={0.005} />
    <Panel size={[0.62, 0.16]} texture={shopSign()} p={[-0.86, 1.36, -1.852]} />
    <Glow color="#ffd9a4" size={0.9} opacity={0.14} p={[-0.86, 1.34, -1.78]} />
    <Box size={[0.62, 0.06, 0.16]} color="#5f6a64" p={[-0.86, 0.02, -1.82]} ink={false} shadow={false} />
    {/* Small lantern beside the café door. */}
    <Box size={[0.025, 0.025, 0.11]} color="#3f4a46" p={[-0.6, 1.19, -1.9]} ink={false} shadow={false} />
    <Cyl radius={0.052} radiusTop={0.035} height={0.07} color="#3f4a46" p={[-0.6, 1.145, -1.815]} ink={false} shadow={false} />
    <Sphere radius={0.032} color="#ffd9a0" material={flat('#ffd9a0')} p={[-0.6, 1.102, -1.815]} ink={false} shadow={false} />
    <Glow color="#ffcb8a" size={0.42} opacity={0.2} p={[-0.6, 1.1, -1.78]} />
    <pointLight position={[-0.6, 1.06, -1.76]} color="#ffc98a" intensity={0.32} distance={1.3} decay={2} />
    {/* AC unit, meter, downpipe, vent. */}
    <RBox size={[0.34, 0.23, 0.2]} radius={0.008} color="#b8bcb4" p={[-2.02, 0.42, -1.86]} ink={false} />
    <Cyl radius={0.075} height={0.02} color="#6f7672" r={[Math.PI / 2, 0, 0]} p={[-2.02, 0.42, -1.75]} ink={false} shadow={false} />
    <Box size={[0.36, 0.03, 0.04]} color="#7f8580" p={[-2.02, 0.3, -1.88]} ink={false} shadow={false} />
    <Box size={[0.15, 0.2, 0.09]} color="#8f948c" p={[-0.62, 0.9, -1.89]} ink={false} shadow={false} />
    <Box size={[0.1, 0.05, 0.01]} color="#e0e4da" p={[-0.62, 0.95, -1.843]} ink={false} shadow={false} />
    <Cyl radius={0.018} height={0.34} color="#7f8480" p={[-0.6, 1.0, -1.9]} ink={false} shadow={false} />
    <Cyl radius={0.02} height={0.26} color="#6f7672" p={[-2.2, 1.32, -1.9]} ink={false} shadow={false} />
    <Steam p={[-2.2, 1.46, -1.88]} height={0.34} color="#cfd8d2" />
    {/* Little step and a plant by the door. */}
    <Plant p={[-1.14, 0, -1.82]} scale={0.9} leafColor="#4f6a52" potColor="#8f8272" />
  </group>
);

const StreetTree = () => (
  <group position={[0.82, 0, -1.62]}>
    <Box size={[0.36, 0.025, 0.36]} color="#5f6a6a" p={[0, 0.012, 0]} ink={false} shadow={false} />
    {[-0.1, 0, 0.1].map((offset) => (
      <Box key={offset} size={[0.3, 0.014, 0.014]} color="#394445" p={[0, 0.025, offset]} ink={false} shadow={false} />
    ))}
    <Cyl radius={0.055} height={1.18} color="#4a4038" p={[0, 0.61, 0]} ink={false} />
    <Cyl radius={0.032} height={0.48} color="#4a4038" p={[0.1, 1.08, 0.02]} r={[0, 0, 0.3]} ink={false} shadow={false} />
    <Cyl radius={0.028} height={0.42} color="#4a4038" p={[-0.1, 1.1, -0.01]} r={[0, 0, -0.26]} ink={false} shadow={false} />
    <Sphere radius={0.36} color="#3f5a46" p={[0, 1.36, 0]} s={[1.15, 0.95, 1.1]} ink={false} />
    <Sphere radius={0.26} color="#476450" p={[0.27, 1.56, -0.04]} ink={false} />
    <Sphere radius={0.25} color="#39513f" p={[-0.24, 1.52, 0.03]} ink={false} />
    <Sphere radius={0.22} color="#4c6a55" p={[0.03, 1.78, -0.02]} s={[1, 0.9, 1]} ink={false} />
    <Sphere radius={0.2} color="#3d5845" p={[-0.28, 1.24, 0.16]} ink={false} />
    <Sphere radius={0.18} color="#486651" p={[0.3, 1.3, 0.14]} ink={false} />
    <ContactShadow p={[0, 0, 0]} radius={0.38} opacity={0.3} />
  </group>
);

/* ------------------------------------------------------------------ */
/* Scene                                                              */
/* ------------------------------------------------------------------ */

/**
 * Scene 07 — 街角邮箱 / POSTBOX CORNER.
 * A quiet Japanese street corner after rain: a red postbox, a lit phone
 * booth, a warm street lamp, a bench, a hedge and a small direction
 * signpost that doubles as the contact card for this portfolio.
 */
export const PostboxScene = () => {
  const meta = getScene('postbox');
  return (
    <group>
      <NightExteriorLights shadowMapSize={2048} />
      <fog attach="fog" args={['#0a1018', 11, 30]} />

      <DioramaBase meta={meta} footprint={[4.6, 4.6]} ground={postboxGround()} subtitle="1:24 / STREET" />

      <ambientLight intensity={0.24} color="#7f9ab8" />
      <hemisphereLight intensity={0.32} color="#8fa8c8" groundColor="#20262c" />

      <CornerBuilding />
      <StreetTree />
      <Hedge />
      <PhoneBooth />
      <Postbox />
      <StreetLamp />
      <Bench />
      <Signpost />
      <Parcel />
      <DroppedMail />
      <pointLight position={[0.15, 0.85, 0.55]} color="#ffc890" intensity={0.5} distance={2.8} decay={2} />
      <pointLight position={[-0.3, 0.6, 1.5]} color="#8fa8c8" intensity={0.25} distance={2.4} decay={2} />

      {/* Wet paving sheen and light pulled down into it. */}
      <Panel
        size={[4.56, 4.56]}
        texture={wetSheenTexture()}
        additive
        opacity={0.18}
        r={[-Math.PI / 2, 0, 0]}
        p={[0, 0.005, 0]}
      />
      <Panel
        size={[1.55, 1.35]}
        texture={lightPoolTexture('#ffd9a0', 0.55)}
        additive
        opacity={0.85}
        r={[-Math.PI / 2, 0, 0]}
        p={[-1.36, 0.008, 0.24]}
      />
      <Panel
        size={[2.3, 1.95]}
        texture={lightPoolTexture('#ffcf8a', 0.42)}
        additive
        opacity={0.85}
        r={[-Math.PI / 2, 0, 0]}
        p={[1.02, 0.008, 0.32]}
      />
      <Panel
        size={[0.42, 1.1]}
        texture={reflectionStreakTexture('#ff5a3a', 0.7)}
        additive
        opacity={0.38}
        r={[-Math.PI / 2, 0, 0]}
        p={[-0.52, 0.009, 1.2]}
      />
      <Panel
        size={[0.68, 1.2]}
        texture={reflectionStreakTexture('#ffc884', 0.6)}
        additive
        opacity={0.32}
        r={[-Math.PI / 2, 0, 0]}
        p={[-1.3, 0.009, 0.52]}
      />
      <Panel
        size={[0.8, 1.0]}
        texture={reflectionStreakTexture('#ffd9a0', 0.5)}
        additive
        opacity={0.28}
        r={[-Math.PI / 2, 0, 0]}
        p={[0.72, 0.009, 1.45]}
      />
      <Panel
        size={[1.3, 1.1]}
        texture={lightPoolTexture('#7f9fbf', 0.3)}
        additive
        opacity={0.22}
        r={[-Math.PI / 2, 0, 0]}
        p={[-0.2, 0.006, 1.92]}
      />

      {/* Standing water ripples + very light night drizzle. */}
      <Ripples count={10} area={[0.95, 0.42]} center={[-0.34, 1.52]} y={0.014} size={0.1} speed={0.36} seed={17} />
      <Ripples count={6} area={[0.6, 0.3]} center={[0.78, 1.06]} y={0.014} size={0.08} speed={0.3} seed={31} />
      <Rain count={320} width={4.4} depth={4.4} height={2.6} opacity={0.13} speed={2.6} />

      {/* Night sky glow above the rooftops and a warm haze over the corner. */}
      <Glow color="#5f7fa8" size={4.4} opacity={0.11} p={[0.2, 1.9, -2.2]} />
      <Glow color="#d8a06a" size={1.8} opacity={0.08} p={[-1.1, 1.72, -1.82]} />
      <Glow color="#8fd4c8" size={0.5} opacity={0.05} p={[1.3, 1.4, -0.5]} />
    </group>
  );
};
