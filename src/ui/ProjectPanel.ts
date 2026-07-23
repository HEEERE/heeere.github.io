import {getProject, type ProjectId} from '../data/projects';

export class ProjectPanel {
  private readonly panel = document.querySelector<HTMLElement>('#project-panel')!;
  private readonly content = document.querySelector<HTMLElement>('[data-project-panel-content]')!;
  private current: ProjectId | null = null;

  public open(id: ProjectId): void {
    this.current = id;
    const project = getProject(id);
    this.panel.dataset.project = id;
    this.panel.style.setProperty('--project-color', project.color);
    this.content.innerHTML = `
      <div class="project-code"><span>${project.number} / ${project.type}</span><span>${project.period}</span></div>
      <h2>${project.title}</h2>
      <p class="panel-subtitle">${project.subtitle}</p>
      <p class="panel-description">${project.description}</p>
      <h3>KEY CONTRIBUTIONS</h3>
      <ul>${project.contributions.map((item) => `<li>${item}</li>`).join('')}</ul>
      <h3>PROCESS TRACE</h3>
      <div class="flow-list">${project.flow.map((step) => `<span>${step}</span>`).join('')}</div>
      <h3>TECHNICAL STACK</h3>
      <div class="flow-list">${project.stack.map((item) => `<span>${item}</span>`).join('')}</div>
      <button type="button" class="scene-action" data-scene-action>${id === 'security' ? '释放测试污染 / SAFE SIMULATION' : id === 'ekg' ? '运行知识处理演示 / RUN ARCHIVE' : '运行记忆验证 / RUN MEMORY CYCLE'}</button>
      ${id === 'security' ? '<p class="simulation-note">安全演示 / 本地模拟数据 / 不包含真实攻击载荷</p>' : '<p class="simulation-note">LOCAL DEMO DATA / NO EXTERNAL API REQUEST</p>'}
      <div class="scene-trace" data-scene-trace>READY / AWAITING INPUT</div>
    `;
    this.panel.classList.add('is-open');
    this.panel.setAttribute('aria-hidden', 'false');
    this.panel.scrollTop = 0;
  }

  public close(): void {
    this.current = null;
    delete this.panel.dataset.project;
    this.panel.classList.remove('is-open');
    this.panel.setAttribute('aria-hidden', 'true');
  }

  public setTrace(message: string): void {
    const trace = this.panel.querySelector<HTMLElement>('[data-scene-trace]');
    if (trace) trace.textContent = message;
  }

  public getCurrent(): ProjectId | null { return this.current; }
}
