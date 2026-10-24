import type {Project} from '../data/projects';
import {projectEvidence} from '../data/projectEvidence';
import {profile} from '../data/profile';
import {ReportDownload} from './ReportDownload';

export type DemoControl = {step: number; variant: number; onStep: (step: number) => void; onVariant: (variant: number) => void};

export const ProjectOutcomes = ({project}: {project: Project}) => (
  <div className="project-outcomes" aria-label={`${project.title} 已实现成果`}>
    {projectEvidence[project.id].outcomes.map((item) => (
      <div key={item.label}><strong>{item.value}</strong><span>{item.label}</span><p>{item.detail}</p></div>
    ))}
  </div>
);

export const ProjectDossier = ({project, control}: {project: Project; control: DemoControl}) => {
  const evidence = projectEvidence[project.id];
  const current = evidence.steps[control.step] ?? evidence.steps[0]!;
  return (
    <div className="project-dossier">
      <section className="project-demo" aria-label={`${project.title} 流程演示`}>
        <p className="eyebrow">INTERACTIVE WALKTHROUGH / 流程演示</p>
        <h3>{evidence.question}</h3>
        <p className="project-note">本地预设样例，不连接项目后端，不代表真实运行或评测结果。</p>
        <p className="project-demo__scenario">{evidence.scenario}</p>
        <div className="project-demo__variants" aria-label="选择演示分支">
          {evidence.variants.map((variant, index) => <button type="button" key={variant} aria-pressed={control.variant === index} onClick={() => control.onVariant(index)}>{variant}</button>)}
        </div>
        <ol className="project-demo__steps">
          {evidence.steps.map((item, index) => (
            <li key={item.label}><button type="button" aria-pressed={control.step === index} onClick={() => control.onStep(index)}><span>0{index + 1}</span>{item.label}</button></li>
          ))}
        </ol>
        <div className="project-demo__readout" aria-live="polite" aria-atomic="true">
          <p className="project-demo__object">场景线索 / {current.object}</p>
          <dl>
            <div><dt>输入</dt><dd>{current.input}</dd></div>
            <div><dt>处理</dt><dd>{current.action}</dd></div>
            <div><dt>输出</dt><dd className="project-demo__output">{control.variant === 1 && current.alternateOutput ? current.alternateOutput : current.output}</dd></div>
          </dl>
        </div>
        <div className="project-demo__controls">
          <span>0{control.step + 1} / 03 · 点击场景标记也可切换</span>
          <button type="button" onClick={() => control.onStep((control.step + 1) % evidence.steps.length)}>{control.step === 2 ? '重新演示 ↺' : '下一步 →'}</button>
        </div>
      </section>
      <section className="exhibit-block">
        <h3>已实现成果</h3>
        <ProjectOutcomes project={project} />
        <p className="project-note">展示系统实现与工程交付，不展示具体实验数据。</p>
        {project.repository ? <div className="project-sources"><a href={project.repository} target="_blank" rel="noreferrer">项目源码 ↗</a><a href={`${project.repository}#readme`} target="_blank" rel="noreferrer">仓库说明 ↗</a></div> : null}
      </section>
      <section className="exhibit-block project-report">
        <div className="project-report__head"><h3>技术报告</h3><ReportDownload id={project.id} label="下载 Markdown" /></div>
        <p className="project-note">设计与实现说明 · 根据项目文档整理</p>
        {evidence.report.map((section) => <details key={section.title}><summary>{section.title}</summary><p>{section.text}</p></details>)}
        <details><summary>验证方法与结果边界</summary><ul>{evidence.verification.map((item) => <li key={item}>{item}</li>)}</ul><p>{evidence.limitation}</p></details>
      </section>
      <a className="btn" href={`mailto:${profile.email}?subject=${encodeURIComponent(`项目交流 / ${project.title}`)}`}>交流此项目 · 索取演示资料 ↗</a>
    </div>
  );
};
