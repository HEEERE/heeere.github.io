import {AbsoluteFill, Easing, Sequence, interpolate, useCurrentFrame} from 'remotion';
import {projects} from '../../../src/data/projects';
import {GridBackground} from '../components/GridBackground';
import {IdentityGlyph} from '../components/IdentityGlyph';
import {SystemLabel} from '../components/SystemLabel';
import {clamp, theme} from '../styles/theme';

const fade = (frame: number, duration: number): number => Math.min(
  interpolate(frame, [0, 16], [0, 1], {...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1)}),
  interpolate(frame, [duration - 14, duration], [1, 0], {...clamp, easing: Easing.bezier(0.7, 0, 0.84, 0)}),
);

const Identity: React.FC = () => {
  const frame = useCurrentFrame();
  return <AbsoluteFill>
    <GridBackground accent={theme.lime} density={96} />
    <div style={{position: 'absolute', inset: `${theme.safeY}px ${theme.safeX}px`, display: 'grid', gridTemplateColumns: '1.4fr .55fr', alignItems: 'center', gap: 100, opacity: fade(frame, 60)}}>
      <div><SystemLabel index="00" label="IDENTITY / AI SYSTEMS" /><h1 style={{margin: '55px 0 26px', color: theme.text, fontFamily: theme.sans, fontSize: 210, lineHeight: .78, letterSpacing: -18}}>纪喆元</h1><p style={{color: theme.lime, fontFamily: theme.mono, fontSize: 36, fontWeight: 800, letterSpacing: 12}}>JI ZHEYUAN</p><p style={{marginTop: 42, color: '#c8ceca', fontFamily: theme.sans, fontSize: 44, fontWeight: 650}}>AI Agent 后端系统 · 知识图谱 · Agent 安全</p></div>
      <div style={{position: 'relative', padding: 16, backgroundColor: theme.cyan, translate: `${interpolate(frame, [0, 34], [80, 0], {...clamp, easing: Easing.bezier(.16,1,.3,1)})}px 0`}}><IdentityGlyph width={430} /></div>
    </div>
  </AbsoluteFill>;
};

const ProjectScene: React.FC<{index: number; duration: number}> = ({index, duration}) => {
  const frame = useCurrentFrame();
  const project = projects[index]!;
  return <AbsoluteFill>
    <GridBackground accent={project.color} density={84 + index * 12} />
    <div style={{position: 'absolute', inset: `${theme.safeY}px ${theme.safeX}px`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', opacity: fade(frame, duration)}}>
      <SystemLabel index={project.number} label={project.type} accent={project.color} />
      <div style={{display: 'grid', gridTemplateColumns: '1.25fr .75fr', alignItems: 'end', gap: 100}}>
        <div>
          <h2 style={{margin: 0, maxWidth: 1120, fontFamily: theme.sans, fontSize: project.id === 'security' ? 108 : 176, lineHeight: project.id === 'security' ? .94 : .84, letterSpacing: project.id === 'security' ? -6 : -10, color: theme.text, opacity: interpolate(frame, [4, 26], [0, 1], clamp), translate: `0 ${interpolate(frame, [4, 26], [80, 0], {...clamp, easing: Easing.bezier(.16,1,.3,1)})}px`}}>{project.id === 'security' ? <>多智能体污染防御<br />策略实验平台</> : project.title}</h2>
          <p style={{marginTop: 42, maxWidth: 1050, color: '#ccd2cd', fontFamily: theme.sans, fontSize: 43, fontWeight: 650, lineHeight: 1.35}}>{project.subtitle}</p>
        </div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>{project.flow.slice(0, 6).map((step, stepIndex) => <div key={step} style={{padding: '18px 22px', borderLeft: `4px solid ${project.color}`, backgroundColor: `${theme.surface}e8`, color: stepIndex <= Math.floor(interpolate(frame, [12, duration - 20], [0, 5], clamp)) ? project.color : theme.muted, fontFamily: theme.mono, fontSize: 27, fontWeight: 700, opacity: interpolate(frame, [8 + stepIndex * 5, 20 + stepIndex * 5], [0, 1], clamp), translate: `${interpolate(frame, [8 + stepIndex * 5, 20 + stepIndex * 5], [40, 0], clamp)}px 0`}}>{String(stepIndex + 1).padStart(2, '0')} / {step}</div>)}</div>
      </div>
    </div>
  </AbsoluteFill>;
};

const Stack: React.FC = () => {
  const frame = useCurrentFrame();
  const groups = [
    ['BACKEND', 'Python · C++ · FastAPI · Pydantic · SQLAlchemy'],
    ['AI / DATA', 'LLM Agent · RAG · Embedding · ChromaDB'],
    ['GRAPH / INFRA', 'Neo4j · Docker · WebSocket · Trace Replay'],
  ];
  return <AbsoluteFill><GridBackground accent={theme.cyan} /><div style={{position: 'absolute', inset: `${theme.safeY}px ${theme.safeX}px`, display: 'flex', flexDirection: 'column', gap: 70, opacity: fade(frame, 60)}}><SystemLabel index="04" label="TECHNICAL STACK" accent={theme.cyan} /><h2 style={{margin: 0, fontFamily: theme.sans, fontSize: 126, lineHeight: .9, letterSpacing: -8}}>FROM MODEL CAPABILITY<br />TO RELIABLE SYSTEMS.</h2><div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: `1px solid ${theme.muted}`}}>{groups.map((group, index) => <div key={group[0]} style={{minHeight: 260, padding: '32px 32px 0', borderRight: index < 2 ? `1px solid ${theme.muted}55` : 0, opacity: interpolate(frame, [index * 7, 22 + index * 7], [0, 1], clamp)}}><b style={{color: [theme.lime, theme.cyan, theme.coral][index], fontFamily: theme.mono, fontSize: 26}}>{group[0]}</b><p style={{marginTop: 94, color: '#c7cdc8', fontFamily: theme.sans, fontSize: 32, lineHeight: 1.5}}>{group[1]}</p></div>)}</div></div></AbsoluteFill>;
};

const Contact: React.FC = () => {
  const frame = useCurrentFrame();
  return <AbsoluteFill><GridBackground accent={theme.lime} density={100} /><div style={{position: 'absolute', inset: `${theme.safeY}px ${theme.safeX}px`, display: 'flex', flexDirection: 'column', justifyContent: 'center', opacity: fade(frame, 60)}}><SystemLabel index="05" label="CONTACT / CONNECT" /><h2 style={{margin: '70px 0 56px', fontFamily: theme.sans, fontSize: 146, lineHeight: .92, letterSpacing: -10}}>一起构建更可靠的<br /><span style={{color: theme.lime}}>AI Agent 系统。</span></h2><div style={{display: 'flex', gap: 48, color: theme.text, fontFamily: theme.mono, fontSize: 30, fontWeight: 700}}><span>github.com/HEEERE</span><span style={{color: theme.lime}}>2401266324@qq.com</span><span>heeere.github.io</span></div></div></AbsoluteFill>;
};

export const PortfolioTeaser: React.FC = () => <AbsoluteFill style={{backgroundColor: theme.background}}>
  <Sequence name="Identity" durationInFrames={60} premountFor={30}><Identity /></Sequence>
  <Sequence name="PMU-Graph" from={60} durationInFrames={90} premountFor={30}><ProjectScene index={0} duration={90} /></Sequence>
  <Sequence name="LLM4EKG" from={150} durationInFrames={90} premountFor={30}><ProjectScene index={1} duration={90} /></Sequence>
  <Sequence name="Security" from={240} durationInFrames={90} premountFor={30}><ProjectScene index={2} duration={90} /></Sequence>
  <Sequence name="Technical Stack" from={330} durationInFrames={60} premountFor={30}><Stack /></Sequence>
  <Sequence name="Contact" from={390} durationInFrames={60} premountFor={30}><Contact /></Sequence>
</AbsoluteFill>;
