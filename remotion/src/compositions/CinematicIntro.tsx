import {AbsoluteFill, Easing, Sequence, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {GridBackground} from '../components/GridBackground';
import {SystemLabel} from '../components/SystemLabel';
import {ThreeGraph} from '../components/ThreeGraph';
import {clamp, theme} from '../styles/theme';

const SystemWake: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const progress = Math.round(interpolate(frame, [0, 1.05 * fps], [0, 100], clamp));
  const logs = ['JZY AGENT SYSTEM', 'INITIALIZING MEMORY GRAPH', 'SECURITY LAYER ONLINE', 'LOADING PROCEDURAL CORE'];
  return <AbsoluteFill style={{padding: `${theme.safeY}px ${theme.safeX}px`, justifyContent: 'flex-end', fontFamily: theme.mono, backgroundColor: theme.background}}>
    <div style={{display: 'flex', flexDirection: 'column', gap: 20, width: 820}}>
      {logs.map((log, index) => <div key={log} style={{color: frame > index * 7 ? index === logs.length - 1 ? theme.lime : theme.text : '#2c322e', fontSize: 30, fontWeight: 700, letterSpacing: 3}}>{log}</div>)}
      <div style={{display: 'flex', alignItems: 'end', gap: 24, marginTop: 24}}>
        <div style={{height: 3, flex: 1, backgroundColor: '#27302d'}}><div style={{height: '100%', width: `${progress}%`, backgroundColor: theme.lime}} /></div>
        <strong style={{color: theme.lime, fontSize: 64}}>{String(progress).padStart(3, '0')}</strong>
      </div>
    </div>
  </AbsoluteFill>;
};

const GraphDive: React.FC = () => {
  const frame = useCurrentFrame();
  return <AbsoluteFill>
    <GridBackground accent={theme.cyan} density={90} />
    <ThreeGraph accent={theme.cyan} />
    <div style={{position: 'absolute', top: theme.safeY, left: theme.safeX, right: theme.safeX, display: 'flex', justifyContent: 'space-between'}}>
      <SystemLabel index="01" label="KNOWLEDGE GRAPH DIVE" accent={theme.cyan} />
      <div style={{color: theme.cyan, fontFamily: theme.mono, fontSize: 26, opacity: interpolate(frame, [8, 22, 50, 64], [0, 1, 1, 0], clamp)}}>MEMORY / RAG / GUARD</div>
    </div>
  </AbsoluteFill>;
};

const CoreActivation: React.FC = () => {
  const frame = useCurrentFrame();
  const modules = [{name: 'PMU-GRAPH', color: theme.lime, x: -520, y: 150}, {name: 'LLM4EKG', color: theme.cyan, x: 0, y: -230}, {name: 'SECURITY', color: theme.coral, x: 520, y: 150}];
  return <AbsoluteFill>
    <GridBackground accent={theme.lime} />
    <ThreeGraph accent={theme.lime} intensity={0.9} />
    <SystemLabel index="02" label="CORE ACTIVATION" accent={theme.lime} />
    <div style={{position: 'absolute', inset: 0, display: 'grid', placeItems: 'center'}}>
      {modules.map((module, index) => <div key={module.name} style={{position: 'absolute', left: '50%', top: '50%', translate: `${interpolate(frame, [4, 50], [0, module.x], {...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1)})}px ${interpolate(frame, [4, 50], [0, module.y], {...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1)})}px`, opacity: interpolate(frame, [index * 5, 32 + index * 5], [0, 1], clamp), padding: '18px 24px', border: `1px solid ${module.color}`, color: module.color, backgroundColor: `${theme.background}cc`, fontFamily: theme.mono, fontSize: 26, fontWeight: 800}}>{module.name}</div>)}
    </div>
  </AbsoluteFill>;
};

const IdentityReveal: React.FC = () => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{padding: `${theme.safeY}px ${theme.safeX}px`, justifyContent: 'center', background: `radial-gradient(circle at 70% 45%, ${theme.lime}1c, transparent 38%), ${theme.background}`}}>
    <SystemLabel index="03" label="IDENTITY RESOLVED" accent={theme.lime} />
    <div style={{marginTop: 64, opacity: interpolate(frame, [0, 24], [0, 1], {...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1)}), translate: `0 ${interpolate(frame, [0, 24], [70, 0], clamp)}px`}}>
      <h1 style={{margin: 0, color: theme.text, fontFamily: theme.sans, fontSize: 220, lineHeight: 0.82, letterSpacing: -18}}>纪喆元</h1>
      <div style={{marginTop: 52, color: theme.lime, fontFamily: theme.mono, fontSize: 42, fontWeight: 800, letterSpacing: 15}}>JI ZHEYUAN</div>
      <div style={{display: 'flex', gap: 32, marginTop: 48, color: theme.text, fontFamily: theme.mono, fontSize: 28, fontWeight: 700}}><span>AI AGENT SYSTEMS</span><span style={{color: theme.lime}}>/</span><span>KNOWLEDGE GRAPH</span><span style={{color: theme.coral}}>/</span><span>AGENT SECURITY</span></div>
    </div>
  </AbsoluteFill>;
};

export const CinematicIntro: React.FC = () => <AbsoluteFill style={{backgroundColor: theme.background}}>
  <Sequence name="System Wake" durationInFrames={36} premountFor={30}><SystemWake /></Sequence>
  <Sequence name="Knowledge Graph Dive" from={36} durationInFrames={66} premountFor={30}><GraphDive /></Sequence>
  <Sequence name="Core Activation" from={102} durationInFrames={60} premountFor={30}><CoreActivation /></Sequence>
  <Sequence name="Identity Reveal" from={162} durationInFrames={78} premountFor={30}><IdentityReveal /></Sequence>
</AbsoluteFill>;
