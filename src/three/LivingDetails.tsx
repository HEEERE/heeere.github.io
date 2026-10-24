import {useEffect, useMemo, useRef, useState} from 'react';
import {useFrame, useThree} from '@react-three/fiber';
import {Html, Line} from '@react-three/drei';
import {CanvasTexture, MathUtils, SRGBColorSpace, type Group, type Mesh, type MeshBasicMaterial} from 'three';
import {Box, Cyl, Glow, Panel, Sphere} from './kit/primitives';
import {canvasTexture, text, FONT_MONO} from './canvas';
import {labelTagTexture, paperSheetTexture, reflectionStreakTexture} from './textures';
import {useQuality} from './quality';
import {useExperience} from '../experience/Experience';
import {identityPaths} from '../data/identity';
import type {DemoControl} from '../ui/ProjectDossier';

export const localClockText = (date = new Date()): string => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
const shopPoster = () => canvasTexture('hakoniwa/identity-poster', 240, 320, ctx => {
  ctx.fillStyle = '#e9dfc5'; ctx.fillRect(0, 0, 240, 320);
  ctx.save(); ctx.translate(52, 35); ctx.scale(3.4, 3.4); ctx.strokeStyle = '#725b37'; ctx.fillStyle = '#b9894d'; ctx.lineWidth = .8;
  ctx.stroke(new Path2D(identityPaths.room)); ctx.stroke(new Path2D(identityPaths.plinth)); ctx.fill(new Path2D(identityPaths.window)); ctx.restore();
  text(ctx, 'HAKONIWA', 120, 221, {size: 22, font: FONT_MONO, align: 'center', color: '#4d483a'});
  text(ctx, 'NIGHT STUDIES', 120, 249, {size: 12, font: FONT_MONO, align: 'center', color: '#766d5a'});
  text(ctx, '灯りのある場所', 120, 286, {size: 16, align: 'center', color: '#766d5a'});
});

const ShopClock = () => {
  const invalidate = useThree(state => state.invalidate);
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 96;
    const result = new CanvasTexture(canvas); result.colorSpace = SRGBColorSpace; return result;
  }, []);
  useEffect(() => {
    const paint = () => {
      const canvas = texture.image as HTMLCanvasElement; const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#17231f'; ctx.fillRect(0, 0, 256, 96);
      text(ctx, localClockText(), 128, 62, {size: 54, font: FONT_MONO, align: 'center', color: '#ebc98f'});
      text(ctx, 'LOCAL TIME', 128, 85, {size: 10, font: FONT_MONO, align: 'center', color: '#b1ac94'});
      texture.needsUpdate = true; invalidate();
    };
    paint(); const timer = setInterval(paint, 10000);
    return () => { clearInterval(timer); texture.dispose(); };
  }, [texture, invalidate]);
  return <group name="visitor-local-clock"><Box size={[.3, .125, .025]} color="#7b684b" p={[-.48, .76, -.455]} ink={false} /><Panel texture={texture} size={[.28, .105]} p={[-.48, .76, -.44]} /></group>;
};

export const ShopLife = () => {
  const visitor = useRef<Group>(null);
  const reflection = useRef<Mesh>(null);
  const quality = useQuality();
  useFrame(({clock}) => {
    const t = clock.elapsedTime % 31;
    if (visitor.current) {
      visitor.current.visible = !quality.reducedMotion && !quality.simplified && t > 19 && t < 24;
      visitor.current.position.x = -1.35 + MathUtils.smoothstep(t, 19, 24) * 1.5;
    }
    if (reflection.current) (reflection.current.material as MeshBasicMaterial).opacity = quality.reducedMotion ? .12 : .12 + Math.sin(clock.elapsedTime * .7) * .025;
  });
  return <group>
    <ShopClock />
    <Panel size={[.18, .24]} texture={shopPoster()} p={[-.76, .55, -.462]} />
    <group ref={visitor} position={[-1.35, .06, -1.35]} visible={false} name="passing-silhouette">
      <Sphere radius={.055} color="#354039" p={[0, .57, 0]} ink={false} />
      <Cyl radius={.065} radiusTop={.052} height={.28} color="#3f4840" p={[0, .37, 0]} ink={false} />
    </group>
    <mesh ref={reflection} position={[-.12, .009, .63]} rotation={[-Math.PI / 2, 0, 0]} userData={{ignoreBounds: true}}>
      <planeGeometry args={[.8, .66]} /><meshBasicMaterial map={reflectionStreakTexture('#ffce93', .5)} transparent opacity={.12} depthWrite={false} toneMapped={false} />
    </mesh>
  </group>;
};

export const MemoryDetails = ({control}: {control?: DemoControl}) => {
  const card = useRef<Group>(null);
  const start = useRef<number | null>(null);
  const quality = useQuality();
  useEffect(() => { start.current = null; }, [control?.step, control?.variant]);
  useFrame(({clock}) => {
    if (!card.current) return;
    start.current ??= clock.elapsedTime;
    const t = quality.reducedMotion || !control || control.step !== 0 ? 1 : Math.min(1, (clock.elapsedTime - start.current) / 1.1);
    const eased = t * t * (3 - 2 * t);
    card.current.position.set(-.38, .565 + (1 - eased) * .16, .1 + (1 - eased) * .19);
    card.current.rotation.x = (1 - eased) * -.18;
  });
  const verified = control?.step === 1;
  const active = control?.step === 2 && control.variant === 0;
  return <group name="memory-process-details">
    <Box size={[.29, .014, .2]} color="#566b6e" p={[-.38, .557, .1]} ink={false} />
    <Box size={[.29, .04, .012]} color="#6e8385" p={[-.38, .572, .005]} ink={false} />
    <group ref={card} position={[-.38, .565, .1]} name="collected-memory-card"><Panel size={[.24, .15]} texture={paperSheetTexture('PMU-017 / TRACE', 5)} r={[-Math.PI / 2, 0, 0]} /></group>
    <Panel size={[.2, .035]} texture={labelTagTexture('CANDIDATE', '#d5b47f')} p={[-.38, .54, .215]} />
    <pointLight position={[-.72, 1.34, -.18]} color={control?.variant ? '#d5ae78' : '#ffdcaa'} intensity={verified ? 2.1 : .1} distance={1.8} />
    <Sphere radius={.016} color={active ? '#a8cfab' : '#4d5d57'} p={[1.2, 1.03, -1.11]} ink={false} />
    {active ? <Glow p={[1.2, 1.03, -1.09]} color="#a8cfab" size={.17} opacity={.26} /> : null}
  </group>;
};

export const EvidenceDetails = ({control}: {control?: DemoControl}) => {
  if (!control) return null;
  const step = control.step;
  const color = control.variant ? '#d7b07a' : '#a5d8c7';
  const points: [number, number, number][] = [[-.77, .88, -1.53], [-.37, 1.17, -1.53], [.18, 1.04, -1.53]];
  return <group name="evidence-path" userData={{step, variant: control.variant}}>
    <Panel size={[.29, .37]} color={color} additive opacity={.16} r={[-Math.PI / 2, 0, .2]} p={[.12, .751, .34]} />
    <Panel size={[.11, .045]} texture={labelTagTexture('EVIDENCE', color)} r={[-Math.PI / 2, 0, .2]} p={[.24, .756, .51]} />
    {step > 0 ? <Line points={points.slice(0, step + 1)} color={color} lineWidth={1.5} transparent opacity={.6} /> : null}
    {points.slice(0, step + 1).map((point, index) => <group key={index} position={point}>
      <mesh userData={{ignoreBounds: true}}><ringGeometry args={[.025, .032, 24]} /><meshBasicMaterial color={color} transparent opacity={.8} toneMapped={false} /></mesh>
    </group>)}
    <pointLight position={[.12, .98, .34]} color={color} intensity={.35} distance={.75} />
  </group>;
};

export const DeskBookmark = () => {
  const [hovered, setHovered] = useState(false);
  const ribbon = useRef<Group>(null);
  const quality = useQuality();
  const invalidate = useThree(state => state.invalidate);
  useFrame((_, delta) => {
    if (!ribbon.current) return;
    const target = hovered ? -.28 : -.03;
    ribbon.current.rotation.x = quality.reducedMotion ? target : MathUtils.damp(ribbon.current.rotation.x, target, 6, delta);
  });
  return <group name="notebook-bookmark" position={[-.29, .435, -1.11]} onPointerOver={event => { event.stopPropagation(); setHovered(true); invalidate(); }} onPointerOut={() => { setHovered(false); invalidate(); }}>
    <group ref={ribbon}><Box size={[.022, .003, .17]} color="#b59861" p={[0, 0, .06]} ink={false} /></group>
  </group>;
};

const workshopObjects: Record<string, {position: [number, number, number]; size: [number, number]; label: string}> = {
  A: {position: [-.8, 1.15, -1.54], size: [1.0, .48], label: 'Backend · 接口与工具'},
  B: {position: [-.18, .8, -.89], size: [.6, .42], label: 'AI / Data · 检索与记忆'},
  C: {position: [1.15, .62, -1.13], size: [.4, .94], label: 'Graph / Infra · 图谱与部署'},
};
export const WorkshopDetails = () => {
  const quality = useQuality();
  const {workshopGroup} = useExperience();
  const selected = workshopGroup ? workshopObjects[workshopGroup] : null;
  if (!selected || quality.tier !== 'exhibit') return null;
  const [w, h] = selected.size;
  return <group position={selected.position} name="selected-tool-group">
    <Line points={[[-w / 2, -h / 2, 0], [w / 2, -h / 2, 0], [w / 2, h / 2, 0], [-w / 2, h / 2, 0], [-w / 2, -h / 2, 0]]} color="#d8b981" lineWidth={1.5} transparent opacity={.8} />
    <pointLight position={[0, 0, .25]} color="#efca8f" intensity={.6} distance={1.1} />
    <Html position={[0, h / 2 + .1, 0]} center wrapperClass="scene-detail-anchor" zIndexRange={[3, 1]} style={{pointerEvents: 'none'}}><span className="workshop-label">{selected.label}</span></Html>
  </group>;
};
