import {readFile, mkdir, writeFile} from 'node:fs/promises';
import ts from 'typescript';

const loadData = async (path) => {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  const {outputText} = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022}});
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
};
const {projects} = await loadData('../src/data/projects.ts');
const {projectEvidence} = await loadData('../src/data/projectEvidence.ts');
const directory = new URL('../public/reports/', import.meta.url);
await mkdir(directory, {recursive: true});
for (const project of projects) {
  const evidence = projectEvidence[project.id];
  const sections = evidence.report.map(({title, text}) => `## ${title}\n\n${text}`).join('\n\n');
  const report = `# ${project.title} — 技术报告\n\n${project.subtitle}\n\n作者：纪喆元｜角色：${project.role}｜项目时间：${project.period}｜状态：${project.status}\n\n> 根据作品集现有项目自述整理的设计与实现说明。验证方法为复核建议，流程演示采用本地预设数据；本报告不包含原始评测记录或独立复现结论。\n\n## 已实现成果（项目自述）\n\n${evidence.outcomes.map((item) => `- **${item.value} / ${item.label}**：${item.detail}`).join('\n')}\n\n${sections}\n\n## 个人贡献\n\n${project.contributions.map((item) => `- ${item}`).join('\n')}\n\n## 系统流程\n\n${project.flow.join(' → ')}\n\n## 验证方法\n\n${evidence.verification.map((item) => `- ${item}`).join('\n')}\n\n## 结果边界\n\n${evidence.limitation}\n\n## 技术栈\n\n${project.stack.join(' · ')}\n\n## 联系与演示\n\n- 邮箱：2401266324@qq.com\n- 作品集场景：https://heeere.github.io/#/scene/${project.scene}\n- 本地流程演示用于理解架构，可通过邮件交流真实演示及更多资料。\n`;
  const source = project.repository ? `\n## 参考资料\n\n- [项目仓库与 README](${project.repository})\n` : '\n## 参考资料\n\n- MAJD-Guard 项目 README 与 actions、provenance、verification、state 源码模块。\n';
  await writeFile(new URL(`${project.id}.md`, directory), report.replace('根据作品集现有项目自述整理', '根据项目文档与作品集说明整理').replace('已实现成果（项目自述）', '系统实现与交付') + source);
  console.log(`report: ${project.id}.md`);
}
