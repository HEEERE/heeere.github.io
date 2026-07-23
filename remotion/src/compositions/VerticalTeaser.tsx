import {AbsoluteFill, Easing, Sequence, interpolate, useCurrentFrame} from 'remotion';
import {projects} from '../../../src/data/projects';
import {GridBackground} from '../components/GridBackground';
import {IdentityGlyph} from '../components/IdentityGlyph';
import {SystemLabel} from '../components/SystemLabel';
import {clamp, theme} from '../styles/theme';

const VerticalIdentity: React.FC = () => {
  const frame = useCurrentFrame();
  return <AbsoluteFill><GridBackground accent={theme.lime} density={72} /><div style={{position: 'absolute', inset: '120px 76px 140px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}><SystemLabel index="00" label="AI AGENT MEMORY CORE" /><div style={{display: 'flex', flexDirection: 'column', gap: 42, opacity: interpolate(frame, [0, 28], [0, 1], {...clamp, easing: Easing.bezier(.16,1,.3,1)})}}><IdentityGlyph width={260} accent={theme.coral} /><h1 style={{margin: 0, color: theme.text, fontFamily: theme.sans, fontSize: 188, lineHeight: .78, letterSpacing: -16}}>纪喆元</h1><p style={{margin: 0, color: theme.lime, fontFamily: theme.mono, fontSize: 34, fontWeight: 800, letterSpacing: 10}}>JI ZHEYUAN</p><p style={{margin: 0, maxWidth: 850, color: '#c9cfca', fontFamily: theme.sans, fontSize: 48, lineHeight: 1.32, fontWeight: 650}}>AI Agent 后端系统<br />知识图谱 · Agent 安全</p></div></div></AbsoluteFill>;
};

const VerticalProject: React.FC<{index: number}> = ({index}) => {
  const frame = useCurrentFrame();
  const project = projects[index]!;
  return <AbsoluteFill><GridBackground accent={project.color} density={78} /><div style={{position: 'absolute', inset: '120px 76px 140px', display: 'flex', flexDirection: 'column', gap: 72}}><SystemLabel index={project.number} label={project.type} accent={project.color} /><div style={{marginTop: 120, opacity: interpolate(frame, [0, 24], [0, 1], clamp), translate: `0 ${interpolate(frame, [0, 24], [80, 0], {...clamp, easing: Easing.bezier(.16,1,.3,1)})}px`}}><h2 style={{margin: 0, color: theme.text, fontFamily: theme.sans, fontSize: project.id === 'security' ? 94 : 168, lineHeight: project.id === 'security' ? .98 : .86, letterSpacing: project.id === 'security' ? -5 : -10}}>{project.id === 'security' ? <>多智能体污染防御<br />策略实验平台</> : project.title}</h2><p style={{marginTop: 42, color: '#ced4cf', fontFamily: theme.sans, fontSize: 46, lineHeight: 1.35, fontWeight: 650}}>{project.subtitle}</p></div><div style={{display: 'flex', flexDirection: 'column', gap: 18, marginTop: 'auto'}}>{project.flow.slice(0, 6).map((step, stepIndex) => <div key={step} style={{display: 'grid', gridTemplateColumns: '70px 1fr', alignItems: 'center', minHeight: 70, padding: '0 20px', border: `1px solid ${stepIndex <= Math.floor(interpolate(frame, [14, 72], [0, 5], clamp)) ? project.color : theme.muted + '55'}`, backgroundColor: `${theme.background}dd`, color: stepIndex <= Math.floor(interpolate(frame, [14, 72], [0, 5], clamp)) ? project.color : theme.muted, fontFamily: theme.mono, fontSize: 26, fontWeight: 700}}><span>{String(stepIndex + 1).padStart(2, '0')}</span><span>{step}</span></div>)}</div></div></AbsoluteFill>;
};

const VerticalOutro: React.FC = () => {
  const frame = useCurrentFrame();
  return <AbsoluteFill><GridBackground accent={theme.lime} density={82} /><div style={{position: 'absolute', inset: '120px 76px 140px', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}><SystemLabel index="04" label="CONTACT / CONNECT" /><h2 style={{margin: '120px 0 74px', fontFamily: theme.sans, fontSize: 136, lineHeight: .92, letterSpacing: -9, opacity: interpolate(frame, [0, 28], [0, 1], clamp)}}>一起构建<br /><span style={{color: theme.lime}}>更可靠的</span><br />AI Agent 系统。</h2><div style={{display: 'flex', flexDirection: 'column', gap: 24, color: theme.text, fontFamily: theme.mono, fontSize: 30, fontWeight: 700}}><span>github.com/HEEERE</span><span style={{color: theme.lime}}>2401266324@qq.com</span><span>heeere.github.io</span></div></div></AbsoluteFill>;
};

export const VerticalTeaser: React.FC = () => <AbsoluteFill style={{backgroundColor: theme.background}}>
  <Sequence name="Vertical Identity" durationInFrames={60} premountFor={30}><VerticalIdentity /></Sequence>
  <Sequence name="Vertical PMU" from={60} durationInFrames={90} premountFor={30}><VerticalProject index={0} /></Sequence>
  <Sequence name="Vertical EKG" from={150} durationInFrames={90} premountFor={30}><VerticalProject index={1} /></Sequence>
  <Sequence name="Vertical Security" from={240} durationInFrames={90} premountFor={30}><VerticalProject index={2} /></Sequence>
  <Sequence name="Vertical Contact" from={330} durationInFrames={120} premountFor={30}><VerticalOutro /></Sequence>
</AbsoluteFill>;
