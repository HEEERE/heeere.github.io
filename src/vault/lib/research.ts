import {dayKey, makeEntry, type Entry, type EntryKind} from './model';

export const RESEARCH_TEMPLATES: {id: string; label: string; hint: string; kind: EntryKind; body: string; tags: string[]}[] = [
  {id: 'paper', label: '读一篇论文', hint: '问题 · 方法 · 证据', kind: 'tech', tags: ['论文'], body: '## 论文与来源\n\n标题：\n作者 / 年份：\n链接：\n\n## 它解决了什么问题\n\n\n## 核心方法\n\n\n## 实验与证据\n\n\n## 局限与我的判断\n\n\n## 对我的研究有什么用\n\n\n## 下一步\n\n- \n'},
  {id: 'experiment', label: '记一次实验', hint: '假设 · 配置 · 结论', kind: 'tech', tags: ['实验'], body: '## 假设与目标\n\n\n## 环境 / 数据 / 版本\n\n\n## 配置与复现命令\n\n```bash\n\n```\n\n## 结果与证据\n\n\n## 失败分析\n\n\n## 下一步\n\n- \n'},
  {id: 'prompt', label: '存一个 Prompt', hint: '输入 · 约束 · 验收', kind: 'prompt', tags: ['Agent'], body: '## 使用场景\n\n\n## 输入与变量\n\n\n## Prompt\n\n```text\n\n```\n\n## 预期输出与验收标准\n\n\n## 测试结果 / 版本\n\n'},
  {id: 'review', label: '做今日复盘', hint: '收获 · 卡点 · 明天', kind: 'diary', tags: ['复盘'], body: '## 今天推进了什么\n\n- \n\n## 学到的一个关键点\n\n\n## 卡住的地方\n\n\n## 明天最重要的一件事\n\n- \n'},
];

export const researchEntry = (id: string, at = Date.now()): Entry => {
  const template = RESEARCH_TEMPLATES.find((item) => item.id === id);
  if (!template) throw new Error('未知研究模板');
  return {...makeEntry(template.kind, at), title: id === 'review' ? `${dayKey(at)} · 每日复盘` : '', body: template.body, tags: [...template.tags]};
};

export const researchStats = (entries: Entry[], at = Date.now()) => {
  const active = entries.filter((entry) => !entry.deletedAt);
  const days = Array.from({length: 7}, (_, index) => {
    const date = new Date(at);
    date.setDate(date.getDate() - 6 + index);
    const key = dayKey(date.getTime());
    return {key, count: active.filter((entry) => dayKey(entry.createdAt) === key).length};
  });
  return {total: active.length, week: days.reduce((sum, day) => sum + day.count, 0), days};
};
