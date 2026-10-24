import {useEffect, useRef} from 'react';
import {Html, Line} from '@react-three/drei';
import {useFrame} from '@react-three/fiber';
import type {Mesh} from 'three';
import type {ProjectId} from '../data/projects';
import {getProject} from '../data/projects';
import {projectEvidence} from '../data/projectEvidence';
import type {DemoControl} from '../ui/ProjectDossier';
import {useQuality} from './quality';

/** Markers attach the public explanation to the physical objects in each room. */
export const ProjectStory = ({projectId, control}: {projectId: ProjectId; control: DemoControl}) => {
  const evidence = projectEvidence[projectId];
  const project = getProject(projectId);
  const quality = useQuality();
  const pulse = useRef<Mesh>(null);
  const signal = useRef<Mesh>(null);
  const started = useRef<number | null>(null);
  useEffect(() => { started.current = null; }, [control.step, control.variant]);
  const active = evidence.steps[control.step] ?? evidence.steps[0]!;
  const color = control.variant === 1 ? (projectId === 'security' ? '#8fd4c8' : '#eab77a') : project.color;
  useFrame(({clock}) => {
    started.current ??= clock.elapsedTime;
    if (pulse.current) pulse.current.scale.setScalar(quality.reducedMotion ? 1 : 1 + Math.sin(clock.elapsedTime * 2) * 0.12);
    if (signal.current) {
      const from = evidence.steps[Math.max(0, control.step - 1)]!.position;
      const to = active.position;
      const t = quality.reducedMotion ? 1 : Math.min(1, (clock.elapsedTime - started.current) / 1.2);
      signal.current.position.set(from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t, from[2] + (to[2] - from[2]) * t);
    }
  });
  return (
    <group>
      {control.step > 0 ? <Line points={evidence.steps.slice(0, control.step + 1).map((step) => step.position)} color={color} transparent opacity={0.24} lineWidth={1} dashed dashSize={0.06} gapSize={0.06} /> : null}
      <mesh ref={signal} userData={{ignoreBounds: true}}><sphereGeometry args={[0.027, 10, 8]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh>
      <group position={active.position}>
        <mesh ref={pulse} rotation={[-Math.PI / 2, 0, 0]} userData={{ignoreBounds: true}}>
          <torusGeometry args={[0.15, 0.008, 8, 40]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
        <pointLight color={color} intensity={1.1} distance={1.3} decay={2} />
      </group>
      {evidence.steps.map((item, index) => (
        <Html key={item.label} position={item.position} center wrapperClass="story-marker-anchor" zIndexRange={[4, 2]} style={{pointerEvents: 'none'}}>
          <button type="button" className={`story-marker${control.step === index ? ' is-active' : ''}`} aria-pressed={control.step === index}
            aria-label={`${item.object}：${item.label}`} onPointerDown={(event) => event.stopPropagation()} onClick={(event) => {event.stopPropagation(); control.onStep(index);}}>
            <span>0{index + 1}</span><b>{item.label}</b>
          </button>
        </Html>
      ))}
    </group>
  );
};
