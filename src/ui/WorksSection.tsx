import type {CSSProperties} from 'react';
import {useSite} from '../app/site';
import {projects} from '../data/projects';
import {getScene} from '../data/scenes';
import {ProjectOutcomes} from './ProjectDossier';
import {projectEvidence} from '../data/projectEvidence';
import {ReportDownload} from './ReportDownload';
import {EditorialTitle} from './EditorialTitle';
import {DecodeText} from './DecodeText';

export const WorksSection = () => {
  const {openScene} = useSite();
  return (
    <section id="works" className="section section--works">
      <header className="section__head">
        <p className="eyebrow">
          <span>WORKS</span> / 项目
        </p>
        <div className="section__head-row">
          <EditorialTitle lines={['三个项目，', '从问题到实现。']} accent="Selected work" />
          <p className="section__lead">
            三个项目分别对应 Agent 的过程记忆、应急预案的知识图谱问答，以及多智能体链路里的污染检测与阻断。
          </p>
        </div>
      </header>

      <div className="works">
        {projects.map((project) => {
          const scene = getScene(project.scene);
          return (
            <article
              key={project.id}
              className={`work${project.id === 'pmu' ? ' work--featured' : ''}`}
              style={{'--accent': project.color, '--scene-accent': project.color, '--scene-glow': scene.glow} as CSSProperties}
            >
              <div className="work__aside">
                <span className="work__no">{project.number}</span>
                <span className="work__status">{project.status}</span>
                <span className="work__period">{project.period}</span>
              </div>

              <div className="work__main">
                <p className="work__type">{project.type}</p>
                <h3 className="work__title">{project.title}</h3>
                <p className="work__subtitle">{project.subtitle}</p>
                <p className="work__question">{projectEvidence[project.id].question}</p>
                <p className="work__desc">{project.description}</p>
                <ProjectOutcomes project={project} />

                <ul className="work__highlights">
                  {project.highlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>

                <details className="work__implementation"><summary>实现细节与个人贡献</summary><ol className="work__contributions">
                  {project.contributions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol></details>
                <div className="project-links">
                  <button type="button" onClick={() => openScene(project.scene)}>交互演示与技术报告 ↗</button>
                  <ReportDownload id={project.id} />
                  {project.repository ? <a href={project.repository} target="_blank" rel="noreferrer">项目源码 ↗</a> : null}
                </div>

                <div className="work__flow" aria-label="系统流程">
                  {project.flow.map((step, index) => (
                    <span key={step} className="work__flow-step">
                      <b>{step}</b>
                      {index < project.flow.length - 1 ? <i aria-hidden="true">→</i> : null}
                    </span>
                  ))}
                </div>

                <div className="work__foot">
                  <div className="tag-row">
                    {project.stack.map((item) => (
                      <span key={item} className="tag">
                        <DecodeText text={item} />
                      </span>
                    ))}
                  </div>
                  <button className="scene-link" type="button" onClick={() => openScene(project.scene)}>
                    <span className="scene-link__index">{scene.index}</span>
                    <span className="scene-link__label">
                      进入场景 <b>{scene.nameZh}</b>
                    </span>
                    <span aria-hidden="true">↗</span>
                  </button>
                </div>
              </div>

              <div className="work__meta">
                <button className="work__specimen" type="button" onClick={() => openScene(project.scene)} aria-label={`查看${scene.nameZh}交互演示`}>
                  <span className="work__specimen-image"><img src={`/images/scenes/${scene.id}.jpg`} alt={`${scene.nameZh}场景`} loading="lazy" width="800" height="600" /></span>
                  <span className="work__specimen-caption"><b>SCENE {scene.index}</b> {scene.nameZh} <i aria-hidden="true">↗</i></span>
                </button>
                <dl>
                  <div>
                    <dt>角色</dt>
                    <dd>{project.role}</dd>
                  </div>
                  <div>
                    <dt>时间</dt>
                    <dd>{project.period}</dd>
                  </div>
                  <div>
                    <dt>场景</dt>
                    <dd>
                      {scene.index} / {scene.nameZh}
                    </dd>
                  </div>
                </dl>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
