### Requirement: schedules 表结构
Supabase 数据库 SHALL 包含 `schedules` 表，字段与技术方案定义一致：`id`(uuid, PK)、`user_id`(uuid, FK → auth.users.id)、`title`(text, NOT NULL)、`description`(text)、`start_time`(timestamptz, NOT NULL)、`end_time`(timestamptz, NOT NULL)、`all_day`(boolean, DEFAULT false)、`remind_at`(timestamptz[])、`repeat_rule`(text)、`status`(text, DEFAULT 'active')、`color`(text)、`tags`(text[])、`_deleted`(boolean, DEFAULT false)、`_version`(integer, DEFAULT 1)、`created_at`(timestamptz, DEFAULT now())、`updated_at`(timestamptz, DEFAULT now())。

#### Scenario: schedules 表存在且字段完整
- **WHEN** 查询 Supabase 的 schedules 表结构
- **THEN** 所有字段存在，类型和默认值正确

### Requirement: todos 表结构
Supabase 数据库 SHALL 包含 `todos` 表，字段与技术方案定义一致：`id`(uuid, PK)、`user_id`(uuid, FK → auth.users.id)、`title`(text, NOT NULL)、`note`(text)、`due_date`(timestamptz)、`priority`(integer, DEFAULT 0)、`done`(boolean, DEFAULT false)、`done_at`(timestamptz)、`schedule_id`(uuid, FK → schedules.id)、`parent_id`(uuid, FK → todos.id, 自引用)、`sort_order`(integer, DEFAULT 0)、`tags`(text[])、`_deleted`(boolean, DEFAULT false)、`_version`(integer, DEFAULT 1)、`created_at`(timestamptz, DEFAULT now())、`updated_at`(timestamptz, DEFAULT now())。

#### Scenario: todos 表存在且字段完整
- **WHEN** 查询 Supabase 的 todos 表结构
- **THEN** 所有字段存在，类型和默认值正确，外键约束有效

### Requirement: notes 表结构
Supabase 数据库 SHALL 包含 `notes` 表，字段与技术方案定义一致：`id`(uuid, PK)、`user_id`(uuid, FK → auth.users.id)、`content`(text, NOT NULL)、`type`(text, DEFAULT 'memo')、`images`(text[])、`pinned`(boolean, DEFAULT false)、`tags`(text[])、`_deleted`(boolean, DEFAULT false)、`_version`(integer, DEFAULT 1)、`created_at`(timestamptz, DEFAULT now())、`updated_at`(timestamptz, DEFAULT now())。

#### Scenario: notes 表存在且字段完整
- **WHEN** 查询 Supabase 的 notes 表结构
- **THEN** 所有字段存在，类型和默认值正确

### Requirement: RLS 策略
所有表（schedules、todos、notes）SHALL 开启 Row Level Security，并配置策略确保用户只能访问自己的数据。策略规则：`auth.uid() = user_id`。

#### Scenario: 已认证用户访问自己的数据
- **WHEN** 用户 A 已认证，查询 notes 表
- **THEN** 仅返回 `user_id` 等于用户 A 的 `auth.uid()` 的记录

#### Scenario: 未认证请求被拒绝
- **WHEN** 未携带认证信息直接请求数据
- **THEN** 请求被拒绝，返回空结果或权限错误

#### Scenario: 用户无法访问他人数据
- **WHEN** 用户 A 已认证，尝试查询用户 B 的记录
- **THEN** 返回空结果，无法读取或修改用户 B 的数据

### Requirement: updated_at 自动更新触发器
所有表 SHALL 配置数据库触发器，在 UPDATE 操作时自动将 `updated_at` 字段设为当前时间。

#### Scenario: 更新记录时 updated_at 自动刷新
- **WHEN** 更新 todos 表中一条记录的 title
- **THEN** 该记录的 `updated_at` 自动更新为当前时间戳，无需客户端手动设置

### Requirement: Realtime 启用
所有表 SHALL 启用 Supabase Realtime（Postgres Changes 模式），支持客户端通过 WebSocket 订阅 INSERT / UPDATE / DELETE 事件。

#### Scenario: 实时推送正常工作
- **WHEN** 客户端 A 订阅了 notes 表，客户端 B 插入一条新记录
- **THEN** 客户端 A 的回调被触发，收到包含新记录数据的 INSERT 事件
