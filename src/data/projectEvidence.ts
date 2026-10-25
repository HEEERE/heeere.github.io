import type {ProjectId} from './projects';

export type DemoStep = {
  label: string;
  object: string;
  position: [number, number, number];
  input: string;
  action: string;
  output: string;
  alternateOutput?: string;
};
export type ProjectEvidence = {
  question: string;
  outcomes: {value: string; label: string; detail: string}[];
  scenario: string;
  variants: [string, string];
  steps: DemoStep[];
  report: {title: string; text: string}[];
  verification: string[];
  limitation: string;
};

/** Based on the author's existing project descriptions. No benchmark scores are inferred. */
export const projectEvidence: Record<ProjectId, ProjectEvidence> = {
  pmu: {
    question: '如何让 Agent 记住一个过程，并判断它是否值得再次执行？',
    outcomes: [
      {value: '双图谱', label: '记忆组织', detail: '元数据图谱记录来源与证据；技能图谱连接环境、技能与目标。'},
      {value: '验证闭环', label: '执行可靠性', detail: 'Executor–Judge–Repair 串联执行、判定与修复。'},
      {value: 'Sandbox', label: '隔离执行', detail: '结合 Docker 隔离测试，把候选记忆与激活复用分开。'},
    ],
    scenario: '示例任务：把一次数据清洗轨迹整理为过程记忆，再检查能否复用。',
    variants: ['验证通过', '验证失败'],
    steps: [
      {label: '收集轨迹', object: '卡片柜', position: [-1.16, 0.85, -1.25], input: 'task-017 / 清洗 CSV / 执行轨迹', action: '记录输入条件、操作步骤、预期输出与来源，生成 Candidate。', output: 'PMU-017 → Candidate；保留原始轨迹引用。'},
      {label: '隔离验证', object: '记忆装置', position: [0.18, 1.02, -0.62], input: 'Candidate + 示例测试用例', action: 'Executor 在隔离环境执行；Judge 检查结果。失败进入 Repair 后重新验证。', output: '验证闭环通过；执行证据提交激活门控。', alternateOutput: 'Judge: FAIL → Repair → 等待重新验证'},
      {label: '激活复用', object: '状态控制台', position: [0.92, 1.35, -1.35], input: '验证状态 + 环境前置条件', action: '激活需结构、风险、来源与执行证据同时满足；技能晋升有独立门控。', output: '演示预设门控满足 → Active；保留环境与证据关联。', alternateOutput: '保持 Candidate；本次不进入 Active，不允许复用。'},
    ],
    report: [
      {title: '问题与边界', text: '长期任务产生的执行轨迹不等于可靠技能。PMU-Graph 将过程记忆的生成、验证和激活拆成显式状态，目标是让复用行为有来源、有前置条件、有验证依据。本文结合公开仓库 README 与作品集项目说明整理。'},
      {title: '系统设计', text: 'FastAPI 与 Pydantic v2 承载管理及执行接口，SQLAlchemy 管理结构化状态。Metadata Knowledge Graph 组织来源、证据与风险关联；Scenario-Mediated Skill Graph 表达环境状态、技能与目标状态。两张图服务不同查询语义，避免把来源审计与任务规划混成一种关系。'},
      {title: '核心闭环', text: 'Candidate 先通过结构、风险与来源检查进入 Verified；激活还需验证闭环、执行证据与状态门控。失败路径交给 Repair，修复后仍需重新验证。Docker Sandbox 为执行提供隔离边界。已描述的接口覆盖 PMU 管理、任务执行、风险检测、图谱导出、状态流转和任务合成。'},
      {title: '设计取舍', text: '显式状态与双图谱增加了数据同步、状态一致性和查询维护的成本，但使复用决策和问题追踪有明确落点。容器隔离也有启动与资源成本；隔离执行不能替代对技能语义和环境假设的验证。'},
    ],
    verification: ['正常路径：Candidate 经验证后才能激活；记录完整状态变更与证据。', '失败路径：执行错误或判定失败不能激活；Repair 后必须重新验证。', '边界路径：前置条件变化、重复请求与隔离执行失败时，检查状态及审计记录。'],
    limitation: '本页仅展示过程记忆治理机制，不展示具体实验数据；预设演示不调用后端验证器。',
  },
  ekg: {
    question: '一份应急预案中的回答，能否追溯到具体规则和原文？',
    outcomes: [
      {value: '双通道', label: '信息抽取', detail: '规则匹配与 LLM 抽取共同处理实体、条件、动作及隐式关系。'},
      {value: 'Neo4j', label: '结构化知识', detail: '实体对齐后构建图谱，连接关系检索与原文证据召回。'},
      {value: 'Pipeline', label: '图谱构建管线', detail: 'DOCX 规则结构化、混合抽取入库与 PlanMeta 本体锚定。'},
    ],
    scenario: '虚构预案示例：达到演练触发条件后，由谁组织转移？仅用于说明证据链，不作为应急指引。',
    variants: ['证据完整', '证据缺失'],
    steps: [
      {label: '解析预案', object: '预案工作台', position: [-0.9, 0.95, 0.25], input: '演示文档 §2：演练条件满足时，由 A 组组织转移。', action: '规则与 LLM 双通道识别组织实体、触发条件与处置动作。', output: '实体：A 组；条件：演练条件满足；动作：组织转移。'},
      {label: '构建关系', object: '图谱大屏', position: [-0.2, 1.53, -1.42], input: '抽取实体 + 文档来源', action: '通过 Embedding 相似度和中心性锚定聚类对齐表述，形成可查询关系。', output: 'A 组 → 负责 → 组织转移；来源：演示文档 §2。'},
      {label: '回答与引用', object: '问答终端', position: [0.9, 1.08, 0.15], input: '问题：满足演练条件后由谁组织转移？', action: '结合实体关系与原文检索；本演示在缺失证据时展示不足提示。', output: 'A 组组织转移。[演示文档 §2] 可回查原句。', alternateOutput: '证据不足：未召回原文，不在演示中输出确定结论。'},
    ],
    report: [
      {title: '问题与边界', text: '应急预案具有长文档、条件分散和实体表述不一致的特点。LLM4EKG 将文档处理、实体对齐、知识图谱和检索增强问答串联起来，目标是让回答能够同时呈现关系与依据。公开仓库提供 DOCX 规则结构化、混合抽取及本体引导图谱构建的运行入口。'},
      {title: '抽取与实体对齐', text: '抽取阶段结合正则、模式匹配与大模型处理，识别组织实体、触发条件、处置动作和跨段落隐式关系。实体对齐结合 Embedding 相似度与中心性锚定聚类，减少同一实体的不同表述对图谱结构的干扰。'},
      {title: '图谱与检索', text: '对齐结果写入 Neo4j。回答问题时将实体关系检索与原文证据召回结合，使结论可以回到预案文本核对。现有设计包含 Entity Index、Rule Index 与 Emergency-SOP Benchmark，覆盖实体、规则及应急流程层面的评测组织。'},
      {title: '设计取舍', text: '规则通道便于解释和控制，LLM 通道有助于覆盖隐式表达，但会引入抽取不确定性。实体合并有误合并与漏合并的权衡。图谱检索提供关系结构，原文召回保留上下文；二者的覆盖范围需要分别评估。演示中的证据缺失提示是流程说明，不代表后端拒答策略已经验证。'},
    ],
    verification: ['抽取：对实体、触发条件、处置动作与关系分别标注并核对。', '对齐：检查别名合并、同名实体及跨段落关系，保留冲突案例。', '问答：比较检索方案的答案完整性、引用正确性和证据覆盖；记录数据集与模型版本。'],
    limitation: '本页展示架构与引用流程，不展示具体实验数据；问答样例为虚构预案的交互说明。',
  },
  security: {
    question: '如何在动作发生前封住污染路径，并保留可以继续完成的任务？',
    outcomes: [
      {value: 'Ledger', label: '版本化来源', detail: '不可变数据版本与追加状态记录，保留派生关系及动作依据。'},
      {value: '双图', label: 'RAISE 分工', detail: '紧图提出候选，保守图作安全判断，独立检查器复核残余路径。'},
      {value: 'Gateway', label: '执行边界', detail: '统一动作闸门与状态修复，连接隔离、限制保留和干净重放。'},
    ],
    scenario: '示意流程：低可信检索内容进入共享记忆，敏感动作在统一闸门前接受来源与状态检查。',
    variants: ['污染路径', '干净路径'],
    steps: [
      {label: '记录来源', object: '监控工作台', position: [-0.98, 1.05, -1.02], input: '检索内容 → 共享记忆 → 动作参数', action: 'MessageBus 把派生关系写入版本化账本；数据版本不可变，状态变更采用追加记录。', output: '低可信来源关联到敏感动作，建立污染见证。', alternateOutput: '保留干净输入的来源链，等待动作边界检查。'},
      {label: '双图复核', object: '安全终端', position: [0.2, 1.22, -0.98], input: '保守图 / 紧图 + 动作快照', action: '紧图仅提出候选方案；保守图与独立 checker 复核。未知来源、快照变化或证据不足时拒绝。', output: '发现危险路径 → 提交切断与修复方案；模型不能授权放行。', alternateOutput: '未发现污染见证；仍需满足动作契约、权限与执行模式。'},
      {label: '闸门与修复', object: '隔离闸门', position: [0.74, 1.12, -0.45], input: '独立检查结论 + 权限 / 范围 / 执行模式', action: '统一闸门控制动作。修复时提交失效、隔离和限制保留，从干净输入创建新版本。', output: 'BLOCK → 隔离污染版本；干净重放，旧版本不重新激活。', alternateOutput: '演示预设的契约检查通过 → ALLOW；记录动作与来源。'},
    ],
    report: [
      {title: '问题与边界', text: 'RAISE 是多智能体级联污染与防御的研究平台，连接攻击仿真、防御执行、来源追踪与运行观察。本文根据项目 README 和对应源码模块整理，仅展示机制和流程，不展示具体实验数据。'},
      {title: '版本化账本与动作闸门', text: 'MessageBus 连接事件流与 ProvenanceLedger。数据对象以不可变版本保存，后续变化追加到状态记录。ActionGateway 统一检查受保护动作的权限、参数来源、作用范围和执行模式；检测模型只能提供否决证据，不能直接产生授权。执行模式在闸门构造时固定，检查与执行之间的快照变化会使旧依据失效。'},
      {title: '双图分析与独立检查', text: 'RAISE 将分析分为保守图与紧图。紧图提出候选修复或保留方案，保守图承担安全判断；独立 checker 在干预后的保守图上重新检查残余污染路径。UNKNOWN 表示证据、范围或预算不足，UNSATISFIABLE 表示已证明没有可用切断方案，两者不混用。'},
      {title: '状态修复与界面', text: '状态控制器在复核后提交失效、隔离与限制保留。保留版本仍带强制标签，不能充当高影响动作的授权依据；恢复从干净输入创建新版本。FastAPI 与 WebSocket 提供经过裁剪的运行投影，React 界面连接策略编辑、来源图、事件追踪与回放。'},
      {title: '设计取舍', text: '保守图倾向保留可能的污染关系，因此可能扩大干预范围；紧图有助于提出代价更小的候选方案，但不能独立证明安全。独立检查、版本快照和动作队列增加了工程复杂度，换来可重查的执行依据与状态边界。'},
    ],
    verification: ['来源：核对版本不可变、追加式状态变化、运行隔离与派生关系。', '闸门：检查未知来源、快照变化、异常和受限执行模式下的拒绝路径。', '修复：核对双图分工、独立检查、限制标签与干净重放；失效版本不能重新激活。'],
    limitation: '本页只展示代码机制与预设流程，不呈现具体实验数据，也不把流程演示视作防御效果证明。',
  },
};
