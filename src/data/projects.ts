export type ProjectId = 'pmu' | 'ekg' | 'security';

export type Project = {
  id: ProjectId;
  number: string;
  title: string;
  type: string;
  subtitle: string;
  period: string;
  color: string;
  scene: string;
  description: string;
  contributions: readonly string[];
  stack: readonly string[];
  flow: readonly string[];
};

export const projects: readonly Project[] = [
  {
    id: 'pmu',
    number: '01',
    title: 'PMU-Graph',
    type: 'PROCEDURAL MEMORY / SKILL GRAPH',
    subtitle: '面向 LLM Agent 的过程记忆与技能图谱系统',
    period: '2026.01 — 至今',
    color: '#b8ff3d',
    scene: 'MEMORY CULTIVATION CHAMBER',
    description:
      '面向长期运行的 LLM Agent，将任务执行轨迹抽象为可验证、可复用的过程记忆单元 PMU，通过生命周期管理、风险检测和技能图谱组织，提高经验复用能力与行为可控性。',
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
    id: 'ekg',
    number: '02',
    title: 'LLM4EKG',
    type: 'LLM–RAG / EMERGENCY KNOWLEDGE',
    subtitle: '面向应急预案的知识图谱增强生成框架',
    period: '2025.05 — 2026.01',
    color: '#44d9e6',
    scene: 'KNOWLEDGE ARCHIVE',
    description:
      '面向安全关键型应急预案文本，构建“文档解析—规则抽取—实体对齐—知识图谱—可追溯问答”的完整处理链路，解决长文本语义碎片化、实体漂移和答案依据不可追踪等问题。',
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
    id: 'security',
    number: '03',
    title: '多智能体污染防御策略实验平台',
    type: 'MULTI-AGENT / SECURITY',
    subtitle: '多智能体污染传播检测与防御平台',
    period: '2026.04 — 至今',
    color: '#ff6f61',
    scene: 'CONTAMINATION ISOLATION ZONE',
    description:
      '面向 LLM Agent 安全，以模拟数据演示 Prompt Injection、RAG 上下文污染、工具调用污染和记忆污染在多智能体链路中的传播，并提供检测、防御、阻断与实验评估能力。',
    contributions: [
      '以 MessageBus 为核心构建多 Agent 事件流，支持任务执行、检测事件、决策结果及污染传播过程的实时追踪。',
      '实现 L1 正则检测、L2 向量语义检测和 L3 LLM 意图检测，并通过 Fail-Fast 机制减少无效检测开销。',
      '设计 7 类 Guard Agent，以及 Veto、Quorum、Weighted Vote、Fallback 四类共识机制，聚合多源检测证据。',
      '通过 ContainmentRegistry 对污染节点、危险工具、传播边和记忆键进行动态隔离与阻断。',
      '支持 JSON/YAML 策略配置、策略校验与编译、异步运行、WebSocket 实时推送、Benchmark、Trace Replay 和 Docker 部署。',
    ],
    stack: ['FastAPI', 'Pydantic v2', 'SQLite WAL', 'ChromaDB', 'WebSocket', 'Docker'],
    flow: ['Inject (Simulation)', 'L1', 'L2', 'L3', 'Guard Consensus', 'Contain', 'Trace'],
  },
] as const;

export const getProject = (id: ProjectId) => projects.find((project) => project.id === id)!;
