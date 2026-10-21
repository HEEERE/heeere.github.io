import {useSite} from '../app/site';
import {profile} from '../data/profile';

const nowInHaikou = (): string => {
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
  const {openScene} = useSite();
  return (
    <section id="contact" className="section section--contact">
      <div className="contact__copy">
        <p className="eyebrow">
          <span>CONTACT</span> / 街角邮箱
        </p>
        <h2>想聊项目或实习，可以直接发邮件。</h2>
        <p className="contact__lead">目前开放 AI 工程方向的实习机会，也接受项目合作。Agent、知识图谱相关的问题都欢迎。</p>
        <div className="contact__actions">
          <a className="btn btn--primary" href={`mailto:${profile.email}`}>
            {profile.email} <span aria-hidden="true">↗</span>
          </a>
          <a className="btn" href={profile.github} target="_blank" rel="noreferrer">
            github.com/HEEERE <span aria-hidden="true">↗</span>
          </a>
        </div>
        <p className="contact__time">
          <span>HAIKOU</span> {nowInHaikou()} <i>·</i> {profile.availability}
        </p>
      </div>

      <div className="contact__scene">
        <p className="eyebrow">SCENE 07</p>
        <h3>街角邮箱</h3>
        <p>红色邮筒、绿色电话亭和一盏路灯。</p>
        <button className="scene-link" type="button" onClick={() => openScene('postbox')}>
          <span className="scene-link__index">07</span>
          <span className="scene-link__label">
            打开场景 <b>街角邮箱</b>
          </span>
          <span aria-hidden="true">↗</span>
        </button>
        <dl>
          <div>
            <dt>邮箱</dt>
            <dd>{profile.email}</dd>
          </div>
          <div>
            <dt>GitHub</dt>
            <dd>{profile.githubHandle}</dd>
          </div>
          <div>
            <dt>地点</dt>
            <dd>{profile.location}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
};
