import {mainScenes} from '../data/scenes';
import {EditorialTitle} from './EditorialTitle';
import {SceneCard} from './SceneCard';
import {ProjectCarousel} from './ProjectCarousel';

export const SceneGrid = () => (
  <section id="scenes" className="section section--scenes">
    <header className="section__head">
      <p className="eyebrow">
        <span>SCENES</span> / 箱庭藏集
      </p>
      <div className="section__head-row">
        <EditorialTitle lines={['七个微缩场景，', '一份研究档案。']} accent="A world in miniature" />
        <p className="section__lead">
          从一个场景，走进一个项目。点击查看交互流程、技术报告与个人经历；支持的设备上，还可以拖拽模型，换个角度观察。
          <br />
          首屏的雨夜便利店是第一个，下面六个都能点开。
        </p>
      </div>
      <div className="section__meta">
        <span>01 雨夜便利店 已在首屏</span>
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
