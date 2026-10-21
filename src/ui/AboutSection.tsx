import {useSite} from '../app/site';
import {profile} from '../data/profile';

export const AboutSection = () => {
  const {openScene} = useSite();
  return (
    <section id="about" className="section section--about">
      <header className="section__head">
        <p className="eyebrow">
          <span>ABOUT</span> / 关于我
        </p>
      </header>

      <div className="about">
        <div className="about__intro">
          <h2>
            在海南大学读数据科学，
            <br />
            也在做 Agent 系统。
          </h2>
          <p className="about__lead">{profile.personalSummary}</p>
          <p className="about__quote">“{profile.tagline}”</p>
          <button className="scene-link" type="button" onClick={() => openScene('desk')}>
            <span className="scene-link__index">02</span>
            <span className="scene-link__label">
              进入场景 <b>学习工作台</b>
            </span>
            <span aria-hidden="true">↗</span>
          </button>
        </div>

        <div className="about__facts">
          <dl className="fact-list">
            <div>
              <dt>学校</dt>
              <dd>
                {profile.school}
                <span>{profile.schoolNote}</span>
              </dd>
            </div>
            <div>
              <dt>专业</dt>
              <dd>{profile.major}</dd>
            </div>
            <div>
              <dt>学院</dt>
              <dd>{profile.college}</dd>
            </div>
            <div>
              <dt>学制</dt>
              <dd>
                {profile.studyMode}
                <span>{profile.educationPeriod}</span>
              </dd>
            </div>
            <div>
              <dt>地点</dt>
              <dd>{profile.location}</dd>
            </div>
          </dl>

          <div className="about__group">
            <h3>主修课程</h3>
            <ul className="tag-row">
              {profile.courses.map((course) => (
                <li key={course} className="tag">
                  {course}
                </li>
              ))}
            </ul>
          </div>

          <div className="about__group">
            <h3>研究方向</h3>
            <ul className="tag-row">
              {profile.focus.map((item) => (
                <li key={item} className="tag tag--accent">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};
