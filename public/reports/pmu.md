# PMU-Graph — 技术报告

面向 LLM Agent 的过程记忆与技能图谱系统

作者：纪喆元｜角色：独立设计与开发｜项目时间：2026.01 — 2026.09｜状态：已完成

> 根据项目文档与作品集说明整理的设计与实现说明。验证方法为复核建议，流程演示采用本地预设数据；本报告不包含原始评测记录或独立复现结论。

## 系统实现与交付

- **双图谱 / 记忆组织**：元数据图谱记录来源与证据；技能图谱连接环境、技能与目标。
- **验证闭环 / 执行可靠性**：Executor–Judge–Repair 串联执行、判定与修复。
- **Sandbox / 隔离执行**：结合 Docker 隔离测试，把候选记忆与激活复用分开。

## 问题与边界

长期任务产生的执行轨迹不等于可靠技能。PMU-Graph 将过程记忆的生成、验证和激活拆成显式状态，目标是让复用行为有来源、有前置条件、有验证依据。本文结合公开仓库 README 与作品集项目说明整理。

## 系统设计

FastAPI 与 Pydantic v2 承载管理及执行接口，SQLAlchemy 管理结构化状态。Metadata Knowledge Graph 组织来源、证据与风险关联；Scenario-Mediated Skill Graph 表达环境状态、技能与目标状态。两张图服务不同查询语义，避免把来源审计与任务规划混成一种关系。

## 核心闭环

Candidate 先通过结构、风险与来源检查进入 Verified；激活还需验证闭环、执行证据与状态门控。失败路径交给 Repair，修复后仍需重新验证。Docker Sandbox 为执行提供隔离边界。已描述的接口覆盖 PMU 管理、任务执行、风险检测、图谱导出、状态流转和任务合成。

## 设计取舍

显式状态与双图谱增加了数据同步、状态一致性和查询维护的成本，但使复用决策和问题追踪有明确落点。容器隔离也有启动与资源成本；隔离执行不能替代对技能语义和环境假设的验证。

## 个人贡献

- 设计 Candidate、Verified、Active 等状态及状态流转规则，覆盖过程记忆生成、验证、激活、复用与淘汰的完整流程。
- 构建 Metadata Knowledge Graph 与 Scenario-Mediated Skill Graph，支持来源审计、证据追踪、风险关联及“环境状态—技能—目标状态”的任务推理。
- 完成 PMU 管理、任务执行、风险检测、图谱导出、状态流转和任务合成等核心接口设计与实现。
- 设计 Executor–Judge–Repair 验证流程，形成过程记忆的验证与修复闭环。
- 结合 Docker Sandbox 隔离测试，降低不可靠过程记忆被复用的风险。

## 系统流程

Candidate → Executor → Judge → Repair → Verified → Active

## 验证方法

- 正常路径：Candidate 经验证后才能激活；记录完整状态变更与证据。
- 失败路径：执行错误或判定失败不能激活；Repair 后必须重新验证。
- 边界路径：前置条件变化、重复请求与隔离执行失败时，检查状态及审计记录。

## 结果边界

本页仅展示过程记忆治理机制，不展示具体实验数据；预设演示不调用后端验证器。

## 技术栈

FastAPI · Pydantic v2 · SQLAlchemy · Python · Docker · Knowledge Graph

## 联系与演示

- 邮箱：2401266324@qq.com
- 作品集场景：https://heeere.github.io/#/scene/archive
- 本地流程演示用于理解架构，可通过邮件交流真实演示及更多资料。

## 参考资料

- [项目仓库与 README](https://github.com/HEEERE/PMU-Graph)
