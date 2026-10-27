import {mainScenes} from '../data/scenes';
import {EditorialTitle} from './EditorialTitle';
import {SceneCard} from './SceneCard';
import {ProjectCarousel} from './ProjectCarousel';

export const SceneGrid = () => (
  <section id="scenes" className="section section--scenes">
    <header className="section__head">
      <p className="eyebrow">
        <span>SCENES</span> / 场景
      </p>
      <div className="section__head-row">
        <EditorialTitle lines={['七个场景。', '三个项目。']} accent="Three projects, seven scenes" />
        <p className="section__lead">
          每个场景都能点开：交互流程、实现细节、技术报告和下载入口都在里面。
          <br />
          桌面端可以拖拽旋转，换个角度看。
        </p>
      </div>
      <div className="section__meta">
        <span>01 雨夜便利店 · 首屏</span>
        <span>项目 · 关于 · 技能 · 联系</span>
        <span>点击进入</span>
      </div>
    </header>

    <ProjectCarousel />
    <div className="scene-grid scene-grid--personal">
      {mainScenes.filter(scene => scene.kind !== 'project').map((scene) => (
        <SceneCard key={scene.id} meta={scene} />
      ))}
    </div>
  </section>
);
