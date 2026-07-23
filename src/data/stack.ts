export const stackGroups = [
  {
    index: 'A',
    title: 'Backend',
    items: ['Python', 'C++', 'FastAPI', 'Pydantic v2', 'SQLAlchemy', 'SQLite WAL', 'WebSocket'],
  },
  {
    index: 'B',
    title: 'AI / Data',
    items: ['LLM Agent', 'Tool Calling', 'Memory', 'Planning', 'Reflection', 'Multi-Agent', 'RAG', 'Embedding', 'Hybrid Retrieval', 'Rerank', 'RAGAS', 'ChromaDB', 'NLP'],
  },
  {
    index: 'C',
    title: 'Graph / Infra',
    items: ['Neo4j', 'Knowledge Graph', 'Docker Sandbox', 'Trace Replay', 'Benchmark', 'Git', 'Linux', 'Claude Code', 'Codex'],
  },
] as const;
