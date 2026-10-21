export const stackGroups = [
  {
    index: 'A',
    title: 'Backend',
    subtitle: '接口、状态与事件',
    items: ['Python', 'C++', 'FastAPI', 'Pydantic v2', 'SQLAlchemy', 'SQLite WAL', 'WebSocket'],
  },
  {
    index: 'B',
    title: 'AI / Data',
    subtitle: '检索、记忆与协作',
    items: [
      'LLM Agent',
      'Tool Calling',
      'Memory',
      'Planning',
      'Reflection',
      'Multi-Agent',
      'RAG',
      'Embedding',
      'Hybrid Retrieval',
      'Rerank',
      'RAGAS',
      'ChromaDB',
      'NLP',
    ],
  },
  {
    index: 'C',
    title: 'Graph / Infra',
    subtitle: '图谱、部署与工具',
    items: ['Neo4j', 'Knowledge Graph', 'Docker Sandbox', 'Trace Replay', 'Benchmark', 'Git', 'Linux', 'Claude Code', 'Codex'],
  },
] as const;

export const toolWall = [
  {label: 'Python', note: 'backend / agent'},
  {label: 'FastAPI', note: 'async api'},
  {label: 'Neo4j', note: 'knowledge graph'},
  {label: 'Docker', note: 'sandbox / deploy'},
  {label: 'WebSocket', note: 'realtime trace'},
  {label: 'RAG', note: 'retrieval chain'},
  {label: 'Agent', note: 'tool / memory'},
  {label: 'Security', note: 'injection defense'},
] as const;
