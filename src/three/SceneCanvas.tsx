import {Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode} from 'react';
import {Canvas, useFrame, useThree} from '@react-three/fiber';
import {OrbitControls, Preload} from '@react-three/drei';
import {ACESFilmicToneMapping, Box3, MathUtils, Mesh, PCFSoftShadowMap, PerspectiveCamera, Vector3, type Group} from 'three';
import type {OrbitControls as OrbitControlsImpl} from 'three-stdlib';
import type {SceneMeta} from '../data/scenes';
import {detectLowPower, QualityProvider, qualityFor, useQuality, type QualityTier} from './quality';
import {useSite} from '../app/site';

const DEG = Math.PI / 180;
const FOV = 30;

type FramedSceneProps = {
  meta: SceneMeta;
  tier: QualityTier;
  hovered: boolean;
  interactive: boolean;
  sway: boolean;
  /** Shift the model horizontally, in half-viewport widths (used by the overlay). */
  shiftX?: number;
  onReady?: () => void;
  children: ReactNode;
};

/**
 * Frames the diorama from the scene's declared viewpoint, fits it to the canvas
 * and wires up orbit controls with tight limits so the model always reads as a
 * collectible on a plinth instead of a free camera.
 */
const FramedScene = ({meta, tier, hovered, interactive, sway, shiftX = 0, onReady, children}: FramedSceneProps) => {
  const quality = useQuality();
  const content = useRef<Group>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const camera = useThree((state) => state.camera) as PerspectiveCamera;
  const size = useThree((state) => state.size);
  const base = useRef({distance: 8, azimuth: meta.camera.azimuth * DEG, polar: Math.PI / 2 - meta.camera.elevation * DEG});
  const swayBase = useRef(meta.camera.azimuth * DEG);
  const lastInteraction = useRef(0);
  const dragging = useRef(false);
  const readySent = useRef(false);
  const fitted = useRef(false);

  const fit = useCallback((): boolean => {
    const group = content.current;
    if (!group) return false;
    group.updateWorldMatrix(true, true);
    const bounds = new Box3();
    const scratch = new Box3();
    group.traverse((object) => {
      const mesh = object as Mesh;
      if (!mesh.isMesh || !mesh.geometry) return;
      if (mesh.userData.ignoreBounds) return;
      const geometry = mesh.geometry;
      if (!geometry.boundingBox) geometry.computeBoundingBox();
      if (!geometry.boundingBox) return;
      scratch.copy(geometry.boundingBox).applyMatrix4(mesh.matrixWorld);
      bounds.union(scratch);
    });
    if (bounds.isEmpty()) return false;

    camera.aspect = size.width / Math.max(1, size.height);
    camera.fov = FOV;
    camera.updateProjectionMatrix();

    const view = meta.camera;
    const target = new Vector3(view.target[0], view.target[1], view.target[2]);
    const azimuth = view.azimuth * DEG;
    const elevation = view.elevation * DEG;
    const direction = new Vector3(Math.sin(azimuth) * Math.cos(elevation), Math.sin(elevation), Math.cos(azimuth) * Math.cos(elevation)).normalize();

    // Orthonormal camera basis for a look-at of `target`.
    camera.position.copy(target).add(direction);
    camera.lookAt(target);
    camera.updateMatrixWorld(true);
    const right = new Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
    const up = new Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
    const tanV = Math.tan((FOV * DEG) / 2);
    const tanH = tanV * camera.aspect;
    const basePadding = view.padding ?? 1.14;
    const padding = tier === 'card' ? basePadding * 0.98 : tier === 'exhibit' ? basePadding * 0.9 : basePadding;

    let distance = 0;
    const corner = new Vector3();
    for (let index = 0; index < 8; index += 1) {
      corner.set(
        index & 1 ? bounds.max.x : bounds.min.x,
        index & 2 ? bounds.max.y : bounds.min.y,
        index & 4 ? bounds.max.z : bounds.min.z,
      );
      const relative = corner.sub(target);
      const forward = relative.dot(direction);
      distance = Math.max(distance, forward + Math.abs(relative.dot(right)) / tanH);
      distance = Math.max(distance, forward + Math.abs(relative.dot(up)) / tanV);
    }
    distance *= padding;

    camera.position.copy(target).addScaledVector(direction, distance);
    camera.lookAt(target);
    camera.updateProjectionMatrix();

    // Shift the whole diorama sideways (in world space) so it can share the
    // screen with the floating info panel in the exhibit overlay.
    if (shiftX !== 0) {
      const rightAxis = new Vector3().setFromMatrixColumn(camera.matrixWorld, 0).normalize();
      const worldShift = distance * tanV * camera.aspect * shiftX;
      camera.position.addScaledVector(rightAxis, worldShift);
      target.addScaledVector(rightAxis, worldShift);
      camera.lookAt(target);
      camera.updateProjectionMatrix();
    }

    base.current = {
      distance,
      azimuth,
      polar: Math.PI / 2 - elevation,
    };
    swayBase.current = azimuth;

    const controls = controlsRef.current;
    if (controls) {
      controls.target.copy(target);
      controls.minDistance = distance * 0.74;
      controls.maxDistance = distance * (tier === 'exhibit' ? 1.2 : 1.14);
      controls.minPolarAngle = Math.max(0.35, base.current.polar - 0.24);
      controls.maxPolarAngle = Math.min(Math.PI / 2 + 0.16, base.current.polar + 0.2);
      const range = meta.camera.azimuthRange ?? 0.62;
      controls.minAzimuthAngle = azimuth - range;
      controls.maxAzimuthAngle = azimuth + range;
      controls.update();
    }
    return true;
  }, [camera, meta.camera, shiftX, size.height, size.width, tier]);

  useLayoutEffect(() => {
    fitted.current = false;
    fitted.current = fit();
  }, [fit]);

  useEffect(() => {
    if (readySent.current) return;
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => {
        readySent.current = true;
        onReady?.();
      });
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [onReady]);

  useFrame((state, delta) => {
    if (!fitted.current) {
      fitted.current = fit();
    }
    if (!Number.isFinite(camera.fov)) return;
    const targetFov = hovered && tier === 'card' ? FOV * 0.94 : FOV;
    if (Math.abs(camera.fov - targetFov) > 0.01) {
      camera.fov = MathUtils.damp(camera.fov, targetFov, 5, delta);
      camera.updateProjectionMatrix();
    }

    if (!quality.reducedMotion && interactive && sway && !dragging.current) {
      const idleFor = performance.now() - lastInteraction.current;
      if (idleFor > 4500) {
        const drift = Math.sin(state.clock.elapsedTime * 0.32) * 0.038;
        controlsRef.current?.setAzimuthalAngle(swayBase.current + drift);
      }
    }
  });

  return (
    <>
      <group ref={content}>{children}</group>
      {interactive ? (
        <OrbitControls
          ref={controlsRef}
          makeDefault
          enablePan={false}
          enableDamping
          dampingFactor={0.075}
          rotateSpeed={0.55}
          enableZoom={tier === 'exhibit'}
          zoomSpeed={0.6}
          target={[meta.camera.target[0], meta.camera.target[1], meta.camera.target[2]]}
          onStart={() => {
            dragging.current = true;
            lastInteraction.current = performance.now();
          }}
          onEnd={() => {
            dragging.current = false;
            lastInteraction.current = performance.now();
            const controls = controlsRef.current;
            if (controls) swayBase.current = controls.getAzimuthalAngle();
          }}
        />
      ) : null}
      <Preload all />
    </>
  );
};

type SceneCanvasProps = {
  meta: SceneMeta;
  tier: QualityTier;
  /** Pause the render loop (e.g. while a fullscreen overlay is open). */
  paused?: boolean;
  className?: string;
  interactive?: boolean;
  sway?: boolean;
  hovered?: boolean;
  shiftX?: number;
  onReady?: () => void;
  children: ReactNode;
};

/**
 * A self-contained diorama viewport. Each canvas pauses its render loop while it
 * is outside of the viewport, so the page can host several scenes at once.
 */
export const SceneCanvas = ({meta, tier, className, interactive = true, sway = false, hovered = false, shiftX = 0, paused = false, onReady, children}: SceneCanvasProps) => {
  const holder = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [pageVisible, setPageVisible] = useState(() => !document.hidden);
  const {reducedMotion} = useSite();

  const lowPower = useMemo(detectLowPower, []);
  const quality = useMemo(() => qualityFor(tier, reducedMotion, lowPower), [tier, reducedMotion, lowPower]);
  const canOrbit = interactive && !lowPower;

  useEffect(() => {
    const onVisibility = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    const element = holder.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        setVisible(entry.isIntersecting);
      },
      {rootMargin: '260px 0px', threshold: 0},
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (visible) setMounted(true);
  }, [visible]);

  const handleReady = useCallback(() => {
    setReady(true);
    onReady?.();
  }, [onReady]);

  return (
    <div
      ref={holder}
      className={`scene-canvas${ready ? ' is-ready' : ''}${className ? ` ${className}` : ''}`}
      data-tier={tier}
      data-motion={reducedMotion ? 'reduced' : 'full'}
    >
      <img
        className="scene-canvas__poster"
        src={`/images/scenes/${meta.id}.jpg`}
        alt=""
        aria-hidden="true"
        loading={tier === 'card' ? 'lazy' : 'eager'}
        fetchPriority={tier === 'hero' ? 'high' : 'auto'}
        decoding="async"
        onError={(event) => {
          event.currentTarget.style.display = 'none';
        }}
      />
      {mounted ? <Canvas
        dpr={quality.dpr as unknown as [number, number]}
        shadows={quality.shadows ? 'soft' : false}
        frameloop={visible && pageVisible && !paused && !reducedMotion ? 'always' : 'demand'}
        camera={{fov: FOV, near: 0.05, far: 90, position: [6, 4.2, 6.5]}}
        gl={{alpha: true, antialias: true, powerPreference: 'high-performance', stencil: false}}
        onCreated={({gl}) => {
          gl.toneMapping = ACESFilmicToneMapping;
          gl.toneMappingExposure = 0.94;
          gl.shadowMap.type = PCFSoftShadowMap;
          gl.setClearAlpha(0);
        }}
      >
        <QualityProvider value={quality}>
          <Suspense fallback={null}>
            <FramedScene meta={meta} tier={tier} hovered={hovered} interactive={canOrbit} sway={sway} shiftX={shiftX} onReady={handleReady}>
              {children}
            </FramedScene>
          </Suspense>
        </QualityProvider>
      </Canvas> : null}
    </div>
  );
};
