export const profile = {
  name: '纪喆元',
  englishName: 'JI ZHEYUAN',
  initials: 'JZY',
  school: '海南大学',
  schoolNote: '211 / 双一流',
  major: '数据科学与大数据技术',
  college: '网络空间安全学院',
  educationPeriod: '2023.09 — 至今',
  studyMode: '本科 · 全日制',
  location: '海口，中国',
  email: '2401266324@qq.com',
  github: 'https://github.com/HEEERE',
  githubHandle: 'github.com/HEEERE',
  roles: ['AI Agent Systems', 'Knowledge Graph', 'Agent Security'],
  availability: 'OPEN TO AI ENGINEERING INTERNSHIPS',
  tagline: '我关心 Agent 如何记住做过的事，也关心这些记忆如何被污染。',
  intro:
    '我是海南大学网络空间安全学院 2023 级本科生，专业是数据科学与大数据技术。主要做 AI Agent 后端、知识图谱与多智能体安全。这个站点把它们放进七个可以旋转查看的微缩场景里。',
  summary:
    '海南大学数据科学与大数据技术本科生。做 AI Agent 后端、知识图谱、过程记忆和 RAG，也研究多智能体安全。',
  courses: ['数据结构', '分布式系统', '机器学习', '自然语言处理', '知识图谱', '数据仓库与挖掘', '大数据安全'],
  focus: ['AI Agent', 'RAG', '知识图谱', '过程记忆', '多智能体协同与安全'],
  professionalSkills: [
    'Python、C++：数据结构和面向对象基础扎实，能独立完成需求分析、系统设计、接口开发、测试与部署。',
    '后端：常用 FastAPI、Pydantic、SQLAlchemy、SQLite、WebSocket，做过异步任务、事件驱动和复杂状态流转。',
    'RAG：从文档解析、切分、向量化到混合检索、Rerank、引用核查和 RAGAS 评测，整条链路都实现过。',
    'Agent：了解 Tool Calling、Memory、Planning、Reflection 等机制，也做过多 Agent 协作与权限控制。',
    '图谱：用 Neo4j 做实体关系建模、图谱构建、证据追踪和图谱推理。',
    '工具：日常用 Claude Code、Codex 做代码理解、任务拆解、功能开发和问题修复。',
    '安全：做过 Prompt Injection、RAG 污染、工具滥用和记忆污染的复现与防御实验。',
    '工程：Docker、Git、Linux，能完成容器化部署、版本管理和多人协作。',
  ],
  personalSummary:
    '我在海南大学读数据科学与大数据技术，2023 年入学，现在主要做 AI Agent 相关的后端工作。日常写 Python 和 FastAPI，用 Neo4j 建知识图谱，也搭过完整的 RAG 检索链路和多智能体安全实验。多数时候，我要把一句模糊的需求拆成状态、接口和可复现的实验，再把它跑起来、测完、部署。',
} as const;

export type Profile = typeof profile;
