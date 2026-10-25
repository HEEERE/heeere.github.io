export type ProjectId = 'pmu' | 'ekg' | 'security';
export type SceneId = 'konbini' | 'desk' | 'archive' | 'command' | 'security' | 'workshop' | 'postbox';

export type Project = {
  id: ProjectId;
  number: string;
  title: string;
  type: string;
  subtitle: string;
  period: string;
  status: string;
  role: string;
  color: string;
  scene: SceneId;
  sceneName: string;
  description: string;
  highlights: readonly string[];
  contributions: readonly string[];
  stack: readonly string[];
  flow: readonly string[];
  repository?: string;
};

export const projects: readonly Project[] = [
  {
    id: 'ekg',
    repository: 'https://github.com/HEEERE/LLM4EKG',
    number: '01',
    title: 'LLM4EKG',
    type: 'LLM–RAG / EMERGENCY KNOWLEDGE',
    subtitle: '面向应急预案的知识图谱增强生成框架',
    period: '2025.05 — 2026.01',
    status: '已完成',
    role: '核心设计与开发',
    color: '#8fd4c8',
    scene: 'command',
    sceneName: '应急指挥室',
    description:
      '把应急预案这类长文档整理成可问答的知识图谱。文档先被解析成规则和实体，对齐后写入图谱；回答问题时同时召回原文证据，方便核对依据。',
    highlights: ['双通道信息抽取', '实体对齐', '证据追踪问答', 'Benchmark 设计'],
    contributions: [
      '结合正则、模式匹配与大模型抽取，识别组织实体、触发条件、处置动作及跨段落隐式关系。',
      '使用 Embedding 相似度与中心性锚定聚类方法，缓解不同段落中同一实体表述不一致的问题。',
      '基于 Neo4j 构建应急知识图谱，将实体关系检索与原文证据召回相结合，提高回答完整性与可解释性。',
      '设计 Entity Index、Rule Index 与 Emergency-SOP Benchmark。',
    ],
    stack: ['Python', 'Neo4j', 'LLM', 'RAG', 'Embedding', 'Knowledge Graph'],
    flow: ['Document', 'Parse', 'Extract', 'Align', 'Graph', 'Retrieve', 'Answer + Evidence'],
  },
  {
    id: 'pmu',
    repository: 'https://github.com/HEEERE/PMU-Graph',
    number: '02',
    title: 'PMU-Graph',
    type: 'PROCEDURAL MEMORY / SKILL GRAPH',
    subtitle: '面向 LLM Agent 的过程记忆与技能图谱系统',
    period: '2026.01 — 2026.09',
    status: '已完成',
    role: '独立设计与开发',
    color: '#9fc7d8',
    scene: 'archive',
    sceneName: '记忆档案室',
    description:
      '针对长期运行的 LLM Agent，把任务执行轨迹整理成可验证、可复用的过程记忆单元（PMU）。验证过的记忆会进入技能图谱，下次遇到类似任务时可以直接调用，减少重复试错。',
    highlights: ['过程记忆生命周期', '双图谱架构', '验证与修复闭环', 'Docker 隔离测试'],
    contributions: [
      '设计 Candidate、Verified、Active 等状态及状态流转规则，覆盖过程记忆生成、验证、激活、复用与淘汰的完整流程。',
      '构建 Metadata Knowledge Graph 与 Scenario-Mediated Skill Graph，支持来源审计、证据追踪、风险关联及“环境状态—技能—目标状态”的任务推理。',
      '完成 PMU 管理、任务执行、风险检测、图谱导出、状态流转和任务合成等核心接口设计与实现。',
      '设计 Executor–Judge–Repair 验证流程，形成过程记忆的验证与修复闭环。',
      '结合 Docker Sandbox 隔离测试，降低不可靠过程记忆被复用的风险。',
    ],
    stack: ['FastAPI', 'Pydantic v2', 'SQLAlchemy', 'Python', 'Docker', 'Knowledge Graph'],
    flow: ['Candidate', 'Executor', 'Judge', 'Repair', 'Verified', 'Active'],
  },
  {
    id: 'security',
    number: '03',
    title: 'RAISE',
    type: 'MULTI-AGENT / PROVENANCE & DEFENSE',
    subtitle: '多智能体级联污染与防御可视化平台',
    period: '2026.04 — 2026.09',
    status: '已完成',
    role: '独立设计与开发',
    color: '#e0877a',
    scene: 'security',
    sceneName: '防御实验室',
    description:
      '围绕多智能体中的级联污染，连接来源账本、统一动作闸门、双图分析、独立检查与状态修复。用可视化事件流解释污染从哪里来、危险动作为什么被拒绝，以及如何从干净输入恢复。',
    highlights: ['版本化来源账本', 'ActionGateway', 'RAISE 双图机制', '独立检查与干净重放'],
    contributions: [
      '构建 MessageBus 与版本化 ProvenanceLedger，记录消息、记忆、检索和动作参数的来源关系及追加式状态变化。',
      '实现统一 ActionGateway，检查动作权限、参数来源、作用范围与执行模式；检测模型的证据只能否决，不能直接授权。',
      '实现 conservative / tight 双图分工：紧图提出候选修复方案，保守图承担安全判断与独立复核。',
      '通过独立 checker 检查残余污染路径，再提交失效、隔离和限制保留；从干净输入重放，避免重新激活已失效版本。',
      '提供 FastAPI、WebSocket 运行投影、React 操作界面与 Trace Replay，连接策略配置、过程观察和机制验证。',
    ],
    stack: ['FastAPI', 'Python', 'SQLite', 'React', 'TypeScript', 'WebSocket', 'Docker'],
    flow: ['Provenance', 'ActionGateway', 'Dual Graph', 'Independent Check', 'Repair', 'Clean Replay'],
  },
] as const;

export const getProject = (id: ProjectId): Project => {
  const project = projects.find((item) => item.id === id);
  if (!project) throw new Error(`Unknown project: ${id}`);
  return project;
};
