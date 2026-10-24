import {useCallback, useEffect, useRef, useState, type CSSProperties} from 'react';
import {useSite} from '../app/site';
import {profile} from '../data/profile';
import {getProject} from '../data/projects';
import {getScene, scenes, type SceneId} from '../data/scenes';
import {stackGroups} from '../data/stack';
import {SceneViewport} from './SceneViewport';
import {ProjectDossier, type DemoControl} from './ProjectDossier';
import {projectEvidence} from '../data/projectEvidence';
import {useExperience} from '../experience/Experience';
import {SoundControls} from './SoundControls';

const ProjectBody = ({projectId, control}: {projectId: NonNullable<ReturnType<typeof getScene>['projectId']>; control: DemoControl}) => {
  const project = getProject(projectId);
  return (
    <div className="exhibit-body">
      <p className="exhibit-body__lead">{project.description}</p>

      <dl className="exhibit-facts">
        <div>
          <dt>时间</dt>
          <dd>{project.period}</dd>
        </div>
        <div>
          <dt>角色</dt>
          <dd>{project.role}</dd>
        </div>
        <div>
          <dt>状态</dt>
          <dd>{project.status}</dd>
        </div>
      </dl>

      <ProjectDossier project={project} control={control} />
      <section className="exhibit-block">
        <h3>核心亮点</h3>
        <ul className="exhibit-chiprow">
          {project.highlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="exhibit-block">
        <h3>关键工作</h3>
        <ol className="exhibit-list">
          {project.contributions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>

      <section className="exhibit-block">
        <h3>系统流程</h3>
        <div className="exhibit-flow">
          {project.flow.map((step, index) => (
            <span key={step}>
              <b>{step}</b>
              {index < project.flow.length - 1 ? <i aria-hidden="true">→</i> : null}
            </span>
          ))}
        </div>
      </section>

      <section className="exhibit-block">
        <h3>技术栈</h3>
        <ul className="tag-row">
          {project.stack.map((item) => (
            <li key={item} className="tag">
              {item}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

const AboutBody = () => (
  <div className="exhibit-body">
    <p className="exhibit-body__lead">{profile.personalSummary}</p>
    <p className="exhibit-body__quote">“{profile.tagline}”</p>

    <dl className="exhibit-facts">
      <div>
        <dt>学校</dt>
        <dd>
          {profile.school} · {profile.schoolNote}
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
          {profile.studyMode} · {profile.educationPeriod}
        </dd>
      </div>
      <div>
        <dt>地点</dt>
        <dd>{profile.location}</dd>
      </div>
    </dl>

    <section className="exhibit-block">
      <h3>主修课程</h3>
      <ul className="tag-row">
        {profile.courses.map((course) => (
          <li key={course} className="tag">
            {course}
          </li>
        ))}
      </ul>
    </section>

    <section className="exhibit-block">
      <h3>研究方向</h3>
      <ul className="tag-row">
        {profile.focus.map((item) => (
          <li key={item} className="tag tag--accent">
            {item}
          </li>
        ))}
      </ul>
    </section>

    <section className="exhibit-block">
      <h3>能力清单</h3>
      <ol className="exhibit-list">
        {profile.professionalSkills.slice(0, 6).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
    </section>
  </div>
);

const StackBody = () => (
  <div className="exhibit-body">
    <p className="exhibit-body__lead">
      常用的技术按后端、AI / 数据、图谱与基础设施分三组。
    </p>
    {stackGroups.map((group) => (
      <WorkshopGroup key={group.index} group={group} />
    ))}
    <section className="exhibit-block">
      <h3>能力清单</h3>
      <ol className="exhibit-list">
        {profile.professionalSkills.map((item) => <li key={item}>{item}</li>)}
      </ol>
    </section>
  </div>
);

const WorkshopGroup = ({group}: {group: typeof stackGroups[number]}) => {
  const {workshopGroup, setWorkshopGroup} = useExperience();
  return <section className="exhibit-block workshop-group" onPointerEnter={() => setWorkshopGroup(group.index)} onPointerLeave={() => setWorkshopGroup(null)}>
        <button type="button" className="workshop-group__select" aria-pressed={workshopGroup === group.index} onFocus={() => setWorkshopGroup(group.index)} onBlur={() => setWorkshopGroup(null)} onClick={() => setWorkshopGroup(group.index)}>
        <span>
          {group.index} / {group.title}
        </span>
        <span>查看对应工具 ↗</span>
        </button>
        <p className="exhibit-body__note">{group.subtitle}</p>
        <ul className="tag-row">
          {group.items.map((item) => (
            <li key={item} className="tag">
              {item}
            </li>
          ))}
        </ul>
      </section>;
};

const ContactBody = () => (
  <div className="exhibit-body">
    <p className="exhibit-body__lead">
      红色邮筒、绿色电话亭和一盏路灯。项目合作、技术交流或演示沟通，直接发邮件。
    </p>

    <dl className="exhibit-facts">
      <div>
        <dt>邮箱</dt>
        <dd>
          <a href={`mailto:${profile.email}`}>{profile.email}</a>
        </dd>
      </div>
      <div>
        <dt>GitHub</dt>
        <dd>
          <a href={profile.github} target="_blank" rel="noreferrer">
            {profile.githubHandle} ↗
          </a>
        </dd>
      </div>
      <div>
        <dt>地点</dt>
        <dd>{profile.location}</dd>
      </div>
      <div>
        <dt>状态</dt>
        <dd>{profile.availability}</dd>
      </div>
    </dl>

    <div className="exhibit-actions">
      <a className="btn btn--primary" href={`mailto:${profile.email}`}>
        发送邮件 <span aria-hidden="true">↗</span>
      </a>
      <a className="btn" href={profile.github} target="_blank" rel="noreferrer">
        查看 GitHub <span aria-hidden="true">↗</span>
      </a>
    </div>
  </div>
);

const KonbiniBody = ({onNavigate}: {onNavigate: (id: SceneId) => void}) => (
  <div className="exhibit-body">
    <p className="exhibit-body__lead">
      这个站点由七个微缩场景组成：雨夜便利店、学习工作台、记忆档案室、应急指挥室、防御实验室、工具工坊和街角邮箱。
    </p>
    <p className="exhibit-body__note">拖拽可以旋转这个街角。</p>

    <section className="exhibit-block">
      <h3>作品入口</h3>
      <div className="exhibit-scene-list">
        {scenes
          .filter((scene) => scene.kind === 'project')
          .map((scene) => (
            <button key={scene.id} type="button" onClick={() => onNavigate(scene.id)}>
              <span>{scene.index}</span>
              <b>{scene.nameZh}</b>
              <em>{getScene(scene.id).nameEn}</em>
              <i aria-hidden="true">↗</i>
            </button>
          ))}
      </div>
    </section>

    <section className="exhibit-block">
      <h3>其他入口</h3>
      <div className="exhibit-scene-list">
        {scenes
          .filter((scene) => scene.kind !== 'project' && scene.kind !== 'world')
          .map((scene) => (
            <button key={scene.id} type="button" onClick={() => onNavigate(scene.id)}>
              <span>{scene.index}</span>
              <b>{scene.nameZh}</b>
              <em>{scene.kindLabel}</em>
              <i aria-hidden="true">↗</i>
            </button>
          ))}
      </div>
    </section>
  </div>
);

const bodyFor = (sceneId: SceneId, onNavigate: (id: SceneId) => void, control: DemoControl) => {
  const meta = getScene(sceneId);
  if (meta.projectId) return <ProjectBody projectId={meta.projectId} control={control} />;
  if (sceneId === 'desk') return <AboutBody />;
  if (sceneId === 'workshop') return <StackBody />;
  if (sceneId === 'postbox') return <ContactBody />;
  return <KonbiniBody onNavigate={onNavigate} />;
};

export const ExhibitOverlay = ({
  sceneId,
  onClose,
  onNavigate,
}: {
  sceneId: SceneId;
  onClose: () => void;
  onNavigate: (id: SceneId) => void;
}) => {
  const {rich, reducedMotion} = useSite();
  const {cue} = useExperience();
  const meta = getScene(sceneId);
  const [demo, setDemo] = useState({scene: sceneId, step: 0, variant: 0});
  const demoStep = demo.scene === sceneId ? demo.step : 0;
  const demoVariant = demo.scene === sceneId ? demo.variant : 0;
  const control: DemoControl = {
    step: demoStep, variant: demoVariant,
    onStep: (value) => { cue('step'); setDemo({scene: sceneId, step: value, variant: demoVariant}); },
    onVariant: (value) => { cue('step'); setDemo({scene: sceneId, step: demoStep, variant: value}); },
  };
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [posterMode] = useState(() => new URLSearchParams(window.location.search).has('poster'));
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const panelRef = useRef<HTMLElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frame = requestAnimationFrame(() => {
      setOpen(true);
      closeRef.current?.focus({preventScroll: true});
    });
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(closeTimer.current);
      const opener = previousFocus.current;
      // The parent removes inert during the same commit.
      queueMicrotask(() => {
        if (opener?.isConnected) {
          opener.focus({preventScroll: true});
          opener.classList.add('is-returned');
          window.setTimeout(() => opener.classList.remove('is-returned'), 1500);
        }
      });
    };
  }, []);

  const requestClose = useCallback(() => {
    if (closeTimer.current !== undefined) return;
    if (reducedMotion) { onClose(); return; }
    setClosing(true);
    closeTimer.current = window.setTimeout(onClose, 220);
  }, [reducedMotion, onClose]);

  useEffect(() => {
    panelRef.current?.scrollTo({top: 0, behavior: 'instant'});
    bodyRef.current?.scrollTo({top: 0, behavior: 'instant'});
    closeRef.current?.focus({preventScroll: true});
  }, [sceneId]);

  const step = useCallback(
    (direction: 1 | -1) => {
      const index = scenes.findIndex((scene) => scene.id === sceneId);
      const next = scenes[(index + direction + scenes.length) % scenes.length];
      if (next) onNavigate(next.id);
    },
    [sceneId, onNavigate],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === 'Tab') {
        const dialog = closeRef.current?.closest('[role="dialog"]');
        const focusable = Array.from(dialog?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), a[href], summary, [tabindex="0"]') ?? []).filter((node) => node.getClientRects().length > 0);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        requestClose();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        step(-1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        step(1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [requestClose, step]);

  const style = {'--scene-accent': meta.accent, '--scene-glow': meta.glow} as CSSProperties;

  return (
    <div
      className={`exhibit${open ? ' is-open' : ''}${closing ? ' is-closing' : ''}${posterMode ? ' is-poster' : ''}`}
      style={style}
      role="dialog"
      aria-modal="true"
      aria-labelledby="exhibit-title"
    >
      <div className="exhibit__stage">
        <SceneViewport key={sceneId} meta={meta} tier="exhibit" story={posterMode ? undefined : control} />
        <div className="exhibit__stage-label">
          <span className="exhibit__stage-index">SCENE {meta.index}</span>
          <span className="exhibit__stage-name">
            {meta.nameEn} <i>/</i> {meta.nameJp}
          </span>
        </div>
        {rich ? <p className="exhibit__hint">{reducedMotion ? '静态展示' : '拖拽旋转 · 滚轮缩放'}</p> : null}
        {meta.projectId && !posterMode ? <div className="scene-story-caption" aria-live="polite">
          <div><span>0{demoStep + 1} / 03 · 流程示意</span><b>{projectEvidence[meta.projectId].steps[demoStep]!.label}</b>
            <button type="button" onClick={() => control.onStep((demoStep + 1) % 3)}>{demoStep === 2 ? '重看 ↺' : '下一步 →'}</button></div>
          <p>{demoVariant === 1 ? projectEvidence[meta.projectId].steps[demoStep]!.alternateOutput ?? projectEvidence[meta.projectId].steps[demoStep]!.output : projectEvidence[meta.projectId].steps[demoStep]!.output}</p>
        </div> : null}
      </div>

      <aside ref={panelRef} className="exhibit__panel">
        <header key={sceneId} className="exhibit__head">
          <p className="eyebrow">
            <span>{meta.kindLabel}</span> / SCENE {meta.index}
          </p>
          <h2 id="exhibit-title">{meta.nameZh}</h2>
          {meta.projectId ? <p className="exhibit__project-title">{getProject(meta.projectId).title}</p> : null}
          <p className="exhibit__en">
            {meta.nameEn} <i>/</i> {meta.nameJp}
          </p>
          <p className="exhibit__tagline">{meta.tagline}</p>
          <p className="exhibit__description">{meta.description}</p>
          {meta.projectId ? <nav className="exhibit__quicklinks" aria-label="项目资料">
            <button type="button" onClick={() => document.querySelector('.project-demo')?.scrollIntoView({block: 'start', behavior: reducedMotion ? 'instant' : 'smooth'})}>流程演示 ↓</button>
            <button type="button" onClick={() => document.querySelector('.project-report')?.scrollIntoView({block: 'start', behavior: reducedMotion ? 'instant' : 'smooth'})}>技术报告 ↓</button>
            {getProject(meta.projectId).repository ? <a href={getProject(meta.projectId).repository} target="_blank" rel="noreferrer">源码 ↗</a> : null}
          </nav> : null}
        </header>

        <div ref={bodyRef} className="exhibit__body">{bodyFor(sceneId, onNavigate, control)}</div>

        <footer className="exhibit__foot">
          <button type="button" onClick={() => step(-1)}>
            ← 上一个场景
          </button>
          <span className="exhibit__count">
            {meta.index} / 07
          </span>
          <button type="button" onClick={() => step(1)}>
            下一个场景 →
          </button>
        </footer>
      </aside>

      <button ref={closeRef} className="exhibit__close" type="button" onClick={requestClose}>
        <span aria-hidden="true">×</span>
        <em>关闭 / ESC</em>
      </button>
      {!posterMode ? <div className="exhibit__sound"><SoundControls /></div> : null}
    </div>
  );
};
