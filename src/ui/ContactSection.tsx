import {useSite} from '../app/site';
import {profile} from '../data/profile';
import {getScene} from '../data/scenes';
import {SceneViewport} from './SceneViewport';
import {useExperience} from '../experience/Experience';

const nowInTianjin = (): string => {
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Shanghai',
    }).format(new Date());
  } catch {
    return '--:--';
  }
};

export const ContactSection = () => {
  const {openScene, overlayOpen} = useSite();
  const {contactWarm, setContactWarm} = useExperience();
  return (
    <section id="contact" className={`section section--contact${contactWarm ? ' is-warm' : ''}`} onPointerEnter={() => setContactWarm(true)} onPointerLeave={() => setContactWarm(false)} onFocus={() => setContactWarm(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setContactWarm(false); }}>
      <div className="contact__copy">
        <p className="eyebrow">
          <span>CONTACT</span> / 街角邮箱
        </p>
        <h2>雨还在下，<br />欢迎留一封信。</h2>
        <p className="contact__lead">欢迎交流 Agent 系统、知识图谱与安全研究。项目合作、架构讨论或演示交流，请通过邮件联系。</p>
        <div className="contact__actions">
          <a className="btn btn--primary" href={`mailto:${profile.email}`}>
            {profile.email} <span aria-hidden="true">↗</span>
          </a>
          <a className="btn" href={profile.github} target="_blank" rel="noreferrer">
            github.com/HEEERE <span aria-hidden="true">↗</span>
          </a>
        </div>
        <p className="contact__time">
          <span>TIANJIN</span> {nowInTianjin()} <i>·</i> {profile.availability}
        </p>
      </div>

      <div className="contact__scene contact__scene--living">
        <div className="contact__miniature"><SceneViewport meta={getScene('postbox')} tier="card" hovered={contactWarm} paused={overlayOpen} /></div>
        <button className="scene-link" type="button" onClick={() => openScene('postbox')}>
          <span className="scene-link__index">07</span>
          <span className="scene-link__label">
            打开场景 <b>街角邮箱</b>
          </span>
          <span aria-hidden="true">↗</span>
        </button>
      </div>
    </section>
  );
};
