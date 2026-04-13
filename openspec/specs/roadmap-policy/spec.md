# 路线图维护规范（Roadmap Policy）

> 定义 roadmap 的维护规则，确保路线图始终反映当前规划状态。

---

## 一、Roadmap 与 Change 的关系

```
Roadmap（战略层）
  └── Phase：目标 + 交付物 + 验收标准
        └── Change（战术层）：具体实现提案 + 任务拆分
```

- **Roadmap** 定义「做什么」和「为什么做」，不关心「怎么做」
- **Change** 定义「怎么做」，每个 Change 必须关联到某个 Phase
- Roadmap 不包含 task 级别的 checkbox，那是 Change 的职责

---

## 二、何时更新现有 Roadmap

以下情况应**修改现有 `roadmap/spec.md`**：

| 场景 | 说明 |
|------|------|
| **Phase 状态流转** | `planning` → `active` → `done`，在对应 Phase 开始/完成时更新 |
| **交付物范围调整** | 某个 Phase 需要增减交付物（如发现缺少关键交付物，或某项应移到其他 Phase） |
| **验收标准修正** | 实践中发现验收标准不合理，需要放宽或收紧 |
| **Phase 顺序调整** | 因外部因素（如技术限制）需要调整 Phase 先后顺序 |
| **新增 Phase** | 发现需要插入新的 Phase（如安全加固、性能专项） |
| **里程碑表更新** | 与上述改动同步更新里程碑总览表 |

### 更新规则

1. **小幅更新**（状态流转、里程碑表）：可在相关 Change 实施时顺带更新，无需单独提案
2. **实质性变更**（增删 Phase、大幅调整交付物/验收标准）：必须通过 openspec change 提案，说明变更原因和影响

---

## 三、何时新建 Roadmap

以下情况应**创建新的 roadmap spec**（如 `roadmap-v2/spec.md`）：

| 场景 | 说明 |
|------|------|
| **产品方向根本性转变** | 技术栈大换血、目标用户群变更、核心功能重新定义 |
| **当前 Roadmap 全部完成** | 所有 Phase 状态为 `done`，需要开启新的规划周期 |
| **长期维护阶段** | 产品进入稳定期，需要一个新的维护型 roadmap 替代开发型 roadmap |

### 新建规则

- 新 roadmap 以版本号区分（`roadmap-v2`、`roadmap-v3`）
- 旧 roadmap 保留为历史参考，状态标记为 `archived`
- 新 roadmap 的 `.openspec.yaml` 中注明前序版本

---

## 四、Roadmap 编写规范

### Phase 必须包含的字段

| 字段 | 必填 | 说明 |
|------|------|------|
| 状态 | ✅ | `planning` / `active` / `done` |
| 前置依赖 | ✅ | 依赖哪些 Phase（无则写「无」） |
| 目标 | ✅ | 一句话概括本阶段目标 |
| 核心交付物 | ✅ | 列表形式，描述具体交付什么 |
| 验收标准 | ✅ | 可测试的、明确的完成条件 |

### Phase 不应包含的内容

| 内容 | 原因 |
|------|------|
| ❌ checkbox 任务列表 | 具体任务是 Change 的职责 |
| ❌ 绝对时间估算（如「预计 2 周」） | 个人项目节奏不固定，避免心理压力 |
| ❌ 已完成进度标记 | 通过 Phase 状态 + Change 归档追踪 |

---

## 五、Proposal 与 Roadmap 的关联

通过 openspec-propose 创建 Change 时：

1. **proposal 必须注明所属 Phase**（如 `Phase: 0`）
2. **proposal 的交付物必须是对应 Phase 交付物的子集或细化**
3. 如果 proposal 的范围超出了任何现有 Phase，需要先提案更新 roadmap
4. 一个 Phase 可以有多个 Change，每个 Change 覆盖 Phase 交付物的一部分
