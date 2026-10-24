import type {SceneId} from '../data/scenes';
import type {SoundPreferences} from './preferences';

/** Original, locally synthesized sound. No remote media, autoplay or asset requests. */
export const roomProfiles: Record<SceneId, {rain: number; air: number; hum: number; frequency: number; filter: number}> = {
  konbini: {rain: .21, air: .035, hum: .018, frequency: 60, filter: 1800},
  desk: {rain: .07, air: .022, hum: .008, frequency: 96, filter: 750},
  archive: {rain: .035, air: .034, hum: .009, frequency: 82, filter: 620},
  command: {rain: .025, air: .045, hum: .016, frequency: 110, filter: 1050},
  security: {rain: .02, air: .038, hum: .022, frequency: 55, filter: 480},
  workshop: {rain: .045, air: .034, hum: .014, frequency: 73, filter: 850},
  postbox: {rain: .25, air: .06, hum: .006, frequency: 49, filter: 2200},
};
type Voice = {gain: GainNode; source: AudioScheduledSourceNode};
export class Soundscape {
  readonly context: AudioContext;
  private master: GainNode;
  private environment: GainNode;
  private music: GainNode;
  private effects: GainNode;
  private rain: GainNode;
  private rooms: Record<SceneId, GainNode>;
  private noise: AudioBuffer;
  private sources: AudioScheduledSourceNode[] = [];
  private timer: ReturnType<typeof setInterval>;
  private settings: SoundPreferences;
  private scene: SceneId = 'konbini';
  private hidden = false;
  private phrase = 0;
  private tick = 0;
  private lastCue = -1;

  constructor(settings: SoundPreferences) {
    this.context = new AudioContext();
    this.settings = settings;
    const ctx = this.context;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -14;
    limiter.ratio.value = 5;
    this.master.connect(limiter).connect(ctx.destination);
    this.environment = this.bus(this.master);
    this.music = this.bus(this.master);
    this.effects = this.bus(this.master);
    this.noise = ctx.createBuffer(2, ctx.sampleRate * 6, ctx.sampleRate);
    let seed = 7341;
    for (let channel = 0; channel < 2; channel++) {
      const data = this.noise.getChannelData(channel);
      for (let i = 0; i < data.length; i++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        data[i] = (seed / 4294967296) * 2 - 1;
      }
    }
    this.rain = this.noiseVoice(this.environment, 2300, 'lowpass').gain;
    this.rooms = Object.fromEntries(Object.entries(roomProfiles).map(([id, profile]) => {
      const bus = this.bus(this.environment, 0);
      this.noiseVoice(bus, profile.filter, 'lowpass').gain.gain.value = profile.air;
      const hum = ctx.createOscillator();
      hum.frequency.value = profile.frequency;
      const gain = this.bus(bus, profile.hum);
      hum.connect(gain); hum.start(); this.sources.push(hum);
      return [id, bus];
    })) as Record<SceneId, GainNode>;
    this.timer = setInterval(() => this.schedule(), 4000);
    this.configure(settings, 'konbini', document.hidden);
  }
  private bus(destination: AudioNode, volume = 1): GainNode {
    const gain = this.context.createGain(); gain.gain.value = volume; gain.connect(destination); return gain;
  }
  private fade(param: AudioParam, target: number, seconds = .55): void {
    const now = this.context.currentTime;
    param.cancelAndHoldAtTime(now);
    param.setTargetAtTime(target, now, seconds / 3);
  }
  private noiseVoice(destination: AudioNode, frequency: number, type: BiquadFilterType): Voice {
    const source = this.context.createBufferSource(); source.buffer = this.noise; source.loop = true;
    const filter = this.context.createBiquadFilter(); filter.type = type; filter.frequency.value = frequency; filter.Q.value = .4;
    const gain = this.bus(destination, 0);
    source.connect(filter).connect(gain); source.start(); this.sources.push(source);
    return {source, gain};
  }
  configure(settings: SoundPreferences, scene: SceneId, hidden: boolean): void {
    this.settings = settings; this.scene = scene; this.hidden = hidden;
    this.fade(this.master.gain, settings.enabled && !hidden ? settings.volume * .7 : 0, .4);
    this.fade(this.environment.gain, settings.ambience ? 1 : 0);
    this.fade(this.music.gain, settings.music ? 1 : 0, 1.5);
    this.fade(this.effects.gain, settings.ambience ? 1 : 0);
    this.fade(this.rain.gain, roomProfiles[scene].rain, 1.8);
    for (const [id, bus] of Object.entries(this.rooms)) this.fade(bus.gain, id === scene ? 1 : 0, 1.8);
  }
  async resume(): Promise<void> { await this.context.resume(); }
  private note(frequency: number, at: number, length: number, volume: number, destination: AudioNode): void {
    const oscillator = this.context.createOscillator();
    oscillator.type = 'sine'; oscillator.frequency.value = frequency;
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(volume, at + Math.min(.7, length * .15));
    gain.gain.exponentialRampToValueAtTime(.0001, at + length);
    oscillator.connect(gain).connect(destination);
    oscillator.start(at); oscillator.stop(at + length + .1);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }
  private schedule(): void {
    if (!this.settings.enabled || this.hidden || this.context.state !== 'running') return;
    const now = this.context.currentTime;
    if (this.settings.music && this.tick % 2 === 0) {
      const chords = [[130.81, 196, 293.66], [110, 164.81, 261.63], [146.83, 220, 329.63], [98, 146.83, 246.94]];
      const chord = chords[this.phrase++ % chords.length]!;
      chord.forEach((hz, index) => this.note(hz, now + index * .65, 7.5, .025, this.music));
      this.note(chord[2]! * 2, now + 3.2, 3.5, .012, this.music);
    }
    if (this.settings.ambience && this.tick % 3 === 0) {
      if (this.scene === 'archive' || this.scene === 'desk') this.rustle();
      else if (this.scene === 'konbini' || this.scene === 'postbox') this.note(740, now + .1, .13, .018, this.effects);
    }
    this.tick++;
  }
  private rustle(): void {
    const source = this.context.createBufferSource(); source.buffer = this.noise;
    const filter = this.context.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = 1600; filter.Q.value = .7;
    const gain = this.context.createGain(); const now = this.context.currentTime;
    gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(.025, now + .15); gain.gain.linearRampToValueAtTime(0, now + .6);
    source.connect(filter).connect(gain).connect(this.effects); source.start(); source.stop(now + .65);
    source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
  }
  cue(kind: 'enter' | 'step'): void {
    if (!this.settings.enabled || !this.settings.ambience || this.hidden || this.context.state !== 'running') return;
    const now = this.context.currentTime;
    if (now - this.lastCue < .15) return;
    this.lastCue = now;
    this.note(kind === 'enter' ? 392 : 523.25, now, kind === 'enter' ? .6 : .18, .035, this.effects);
  }
  dispose(): void { clearInterval(this.timer); this.sources.forEach(source => source.stop()); void this.context.close(); }
}
