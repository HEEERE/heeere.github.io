import {RESEARCH_TEMPLATES, researchEntry, researchStats} from '../lib/research';
import {greeting, type Entry} from '../lib/model';
import {gardenName} from '../lib/native';

export const ResearchHome = ({entries, onCreate}: {entries: Entry[]; onCreate: (entry: Entry) => void}) => {
  const stats = researchStats(entries);
  return <section className="garden-home" aria-label="研究概览">
    <div className="garden-home__heading"><div><span className="garden-eyebrow">A SMALL SPACE FOR BIG IDEAS</span><h1>{gardenName}</h1><p>{greeting()}，让今天的一个想法，慢慢长成知识。</p></div><span className="garden-seal" aria-hidden="true">庭</span></div>
    <div className="garden-stats"><div><strong>{stats.total}</strong><span>已收藏的思考</span></div><div><strong>{stats.week}</strong><span>近 7 天新记录</span></div><div className="garden-week" aria-label="近七天记录数">{stats.days.map((day) => <span key={day.key} title={`${day.key}：${day.count} 条`} style={{height: `${6 + Math.min(day.count, 8) * 3}px`}} data-active={day.count > 0} />)}</div></div>
    <div className="garden-templates">{RESEARCH_TEMPLATES.map((template, index) => <button type="button" key={template.id} onClick={() => onCreate(researchEntry(template.id))}><span className="garden-template-no">0{index + 1}</span><strong>{template.label}</strong><small>{template.hint}</small><span className="garden-template-arrow" aria-hidden="true">↗</span></button>)}</div>
    <p className="garden-home__foot">只属于你的知识花园 · 在本机加密保存</p>
  </section>;
};
