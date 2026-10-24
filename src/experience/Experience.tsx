import {createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode} from 'react';
import type {SceneId} from '../data/scenes';
import {scenes} from '../data/scenes';
import {readSound, writeLocal, type SoundPreferences} from './preferences';
import {Soundscape} from './soundscape';

type ExperienceValue = {
  sound: SoundPreferences; audioStatus: 'off' | 'waiting' | 'playing' | 'paused' | 'error';
  changeSound: (patch: Partial<SoundPreferences>) => void;
  cue: (kind: 'enter' | 'step') => void;
  section: string; setSection: (section: string) => void;
  visited: ReadonlySet<SceneId>;
  workshopGroup: string | null; setWorkshopGroup: (group: string | null) => void;
  contactWarm: boolean; setContactWarm: (warm: boolean) => void;
};
const Context = createContext<ExperienceValue | null>(null);
export const useExperience = (): ExperienceValue => {
  const value = useContext(Context);
  if (!value) throw new Error('ExperienceProvider missing');
  return value;
};
const readVisited = (): Set<SceneId> => {
  try {
    const data: unknown = JSON.parse(sessionStorage.getItem('hakoniwa.visited') ?? '[]');
    return new Set(scenes.filter(scene => Array.isArray(data) && data.includes(scene.id)).map(scene => scene.id));
  } catch { return new Set(); }
};
const sectionScenes: Record<string, SceneId> = {top: 'konbini', scenes: 'konbini', works: 'archive', about: 'desk', stack: 'workshop', contact: 'postbox'};

export const ExperienceProvider = ({scene, children}: {scene: SceneId | null; children: ReactNode}) => {
  const [sound, setSound] = useState(readSound);
  const [audioStatus, setAudioStatus] = useState<ExperienceValue['audioStatus']>(() => sound.enabled ? 'waiting' : 'off');
  const [section, setSection] = useState('top');
  const [visited, setVisited] = useState(readVisited);
  const [workshopGroup, setWorkshopGroup] = useState<string | null>(null);
  const [contactWarm, setContactWarm] = useState(false);
  const engine = useRef<Soundscape | null>(null);
  const current = useRef({sound, scene: scene ?? sectionScenes[section] ?? 'konbini'});
  current.current = {sound, scene: scene ?? sectionScenes[section] ?? 'konbini'};
  const unlock = useCallback(async () => {
    if (!current.current.sound.enabled) return;
    try {
      engine.current ??= new Soundscape(current.current.sound);
      await engine.current.resume();
      const latest = current.current;
      engine.current.configure(latest.sound, latest.scene, document.hidden);
      setAudioStatus(!latest.sound.enabled ? 'off' : document.hidden ? 'paused' : 'playing');
    } catch { setAudioStatus('error'); }
  }, []);
  const changeSound = useCallback((patch: Partial<SoundPreferences>) => {
    const next = {...current.current.sound, ...patch};
    next.volume = Math.max(0, Math.min(1, next.volume));
    current.current.sound = next;
    setSound(next); writeLocal('hakoniwa.sound.v1', JSON.stringify(next));
    if (next.enabled) void unlock();
    else { engine.current?.configure(next, current.current.scene, document.hidden); setAudioStatus('off'); }
  }, [unlock]);
  const cue = useCallback((kind: 'enter' | 'step') => engine.current?.cue(kind), []);
  useEffect(() => {
    engine.current?.configure(sound, current.current.scene, document.hidden);
  }, [sound, scene, section]);
  useEffect(() => {
    const gesture = () => { if (current.current.sound.enabled && !engine.current) void unlock(); };
    const visibility = () => {
      const latest = current.current;
      engine.current?.configure(latest.sound, latest.scene, document.hidden);
      if (engine.current && latest.sound.enabled) {
        if (document.hidden) setAudioStatus('paused');
        else void unlock();
      }
    };
    window.addEventListener('pointerdown', gesture, {passive: true});
    window.addEventListener('keydown', gesture);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      window.removeEventListener('pointerdown', gesture); window.removeEventListener('keydown', gesture);
      document.removeEventListener('visibilitychange', visibility); engine.current?.dispose();
    };
  }, [unlock]);
  useEffect(() => {
    if (!scene) return;
    cue('enter');
    setVisited(previous => {
      const next = new Set(previous); next.add(scene);
      try { sessionStorage.setItem('hakoniwa.visited', JSON.stringify([...next])); } catch { /* Session only. */ }
      return next;
    });
  }, [scene, cue]);
  return <Context.Provider value={{sound, audioStatus, changeSound, cue, section, setSection, visited, workshopGroup, setWorkshopGroup, contactWarm, setContactWarm}}>{children}</Context.Provider>;
};
