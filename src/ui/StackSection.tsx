import {useSite} from '../app/site';
import {profile} from '../data/profile';
import {stackGroups} from '../data/stack';

export const StackSection = () => {
  const {openScene} = useSite();
  return (
    <section id="stack" className="section section--stack">
      <header className="section__head">
        <p className="eyebrow">
          <span>STACK</span> / 技能与工具
        </p>
        <div className="section__head-row">
          <h2>语言、框架与日常工具</h2>
          <p className="section__lead">
            按后端、AI / 数据、图谱与基础设施分成三组。后面是具体的能力清单。
          </p>
        </div>
      </header>

      <div className="stack">
        {stackGroups.map((group) => (
          <article key={group.index} className="stack__group">
            <header>
              <span className="stack__index">{group.index}</span>
              <div>
                <h3>{group.title}</h3>
                <p>{group.subtitle}</p>
              </div>
            </header>
            <ul>
              {group.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="stack__lower">
        <div className="stack__skills">
          <h3>能力清单 / CAPABILITIES</h3>
          <ol>
            {profile.professionalSkills.map((skill) => (
              <li key={skill}>{skill}</li>
            ))}
          </ol>
        </div>
        <div className="stack__scene">
          <p className="eyebrow">SCENE 06</p>
          <h3>工具工坊</h3>
          <p>工具墙、标签柜和一台小机柜。</p>
          <button className="scene-link" type="button" onClick={() => openScene('workshop')}>
            <span className="scene-link__index">06</span>
            <span className="scene-link__label">
              进入场景 <b>工具工坊</b>
            </span>
            <span aria-hidden="true">↗</span>
          </button>
        </div>
      </div>
    </section>
  );
};
