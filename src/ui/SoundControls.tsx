import {useEffect, useId, useRef, useState} from 'react';
import {useExperience} from '../experience/Experience';

export const SoundControls = () => {
  const {sound, audioStatus, changeSound} = useExperience();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const outside = (event: Event) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('focusin', outside);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('focusin', outside); };
  }, [open]);
  return <div className="sound" ref={root} data-audio-status={audioStatus} onKeyDown={event => {
    if (open && event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setOpen(false); trigger.current?.focus(); }
    if (open && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) event.stopPropagation();
  }}>
    <button ref={trigger} className="sound__trigger" type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(value => !value)}>
      <span className={`sound__bars${audioStatus === 'playing' && sound.volume > 0 && (sound.ambience || sound.music) ? ' is-playing' : ''}`} aria-hidden="true"><i /><i /><i /></span>
      声音：{!sound.enabled ? '关闭' : audioStatus === 'error' ? '不可用' : audioStatus === 'waiting' ? '待开启' : '开启'}
    </button>
    {open ? <div id={id} className="sound__panel" role="group" aria-label="声音设置">
      <div className="sound__heading"><span>雨夜的声音</span><button type="button" aria-pressed={sound.enabled} onClick={() => changeSound({enabled: !sound.enabled})}>{sound.enabled ? '关闭声音' : '开启声音'}</button></div>
      <label><span>环境音 <small>雨声与房间里的细响</small></span><input type="checkbox" checked={sound.ambience} onChange={event => changeSound({ambience: event.target.checked})} /></label>
      <label><span>背景音乐 <small>稀疏、缓慢的和弦</small></span><input type="checkbox" checked={sound.music} onChange={event => changeSound({music: event.target.checked})} /></label>
      <label className="sound__volume"><span>音量 <output>{Math.round(sound.volume * 100)}%</output></span><input aria-label="音量" type="range" min="0" max="100" value={Math.round(sound.volume * 100)} onChange={event => changeSound({volume: Number(event.target.value) / 100})} /></label>
      <p role="status">{audioStatus === 'error' ? '声音暂时无法播放，可以关闭后重试。' : audioStatus === 'paused' ? '页面离开时，声音会轻轻退去。' : '记住你的选择。随时可以回到安静。'}</p>
    </div> : null}
  </div>;
};
