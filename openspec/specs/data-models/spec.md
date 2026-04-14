### Requirement: Schedule 数据模型
共享层 SHALL 导出 `Schedule` TypeScript 类型，包含以下字段：`id`(UUID)、`user_id`(UUID)、`title`(string)、`description`(string | null)、`start_time`(string)、`end_time`(string)、`all_day`(boolean)、`remind_at`(string[])、`repeat_rule`(string | null)、`status`('active' | 'cancelled')、`color`(string | null)、`tags`(string[])、`_deleted`(boolean)、`_version`(number)、`created_at`(string)、`updated_at`(string)。

#### Scenario: Schedule 类型可被导入
- **WHEN** 在 mobile 包中 `import { Schedule } from '@mya/shared'`
- **THEN** TypeScript 正确识别 Schedule 类型及其所有字段

#### Scenario: 同步字段存在
- **WHEN** 查看 Schedule 类型定义
- **THEN** 包含 `_deleted`、`_version`、`updated_at` 字段，用于多端同步

### Requirement: Todo 数据模型
共享层 SHALL 导出 `Todo` TypeScript 类型，包含以下字段：`id`(UUID)、`user_id`(UUID)、`title`(string)、`note`(string | null)、`due_date`(string | null)、`priority`(0 | 1 | 2)、`done`(boolean)、`done_at`(string | null)、`schedule_id`(UUID | null)、`parent_id`(UUID | null)、`sort_order`(number)、`tags`(string[])、`_deleted`(boolean)、`_version`(number)、`created_at`(string)、`updated_at`(string)。

#### Scenario: Todo 类型可被导入
- **WHEN** 在 mobile 包中 `import { Todo } from '@mya/shared'`
- **THEN** TypeScript 正确识别 Todo 类型及其所有字段

#### Scenario: 优先级字段类型约束
- **WHEN** 给 Todo 的 `priority` 赋值 `3`
- **THEN** TypeScript 报类型错误（仅允许 0 / 1 / 2）

### Requirement: Note 数据模型
共享层 SHALL 导出 `Note` TypeScript 类型，包含以下字段：`id`(UUID)、`user_id`(UUID)、`content`(string)、`type`('idea' | 'memo' | 'log')、`images`(string[])、`pinned`(boolean)、`tags`(string[])、`_deleted`(boolean)、`_version`(number)、`created_at`(string)、`updated_at`(string)。

#### Scenario: Note 类型可被导入
- **WHEN** 在 mobile 包中 `import { Note } from '@mya/shared'`
- **THEN** TypeScript 正确识别 Note 类型及其所有字段

#### Scenario: type 字段枚举约束
- **WHEN** 给 Note 的 `type` 赋值 `'todo'`
- **THEN** TypeScript 报类型错误（仅允许 'idea' / 'memo' / 'log'）

### Requirement: 公共基础字段
共享层 SHALL 导出 `BaseModel` 类型或接口，包含所有模型共享的字段：`id`、`user_id`、`_deleted`、`_version`、`created_at`、`updated_at`。Schedule、Todo、Note SHALL 扩展此基础类型。

#### Scenario: 基础字段复用
- **WHEN** 查看 Schedule、Todo、Note 的类型定义
- **THEN** 三者均包含 `id`、`user_id`、`_deleted`、`_version`、`created_at`、`updated_at` 字段，来源于共同的 BaseModel
