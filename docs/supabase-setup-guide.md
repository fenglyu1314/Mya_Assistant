# Supabase 后端配置操作指南

> 本文档对应 Phase 0 任务组 4（任务 4.1 ~ 4.7），指导你在 Supabase Dashboard 上完成所有手动操作。

---

## 目录

1. [注册账号与创建项目（任务 4.1）](#1-注册账号与创建项目任务-41)
2. [创建 schedules 表（任务 4.2）](#2-创建-schedules-表任务-42)
3. [创建 todos 表（任务 4.3）](#3-创建-todos-表任务-43)
4. [创建 notes 表（任务 4.4）](#4-创建-notes-表任务-44)
5. [创建 updated_at 自动更新触发器（任务 4.5）](#5-创建-updated_at-自动更新触发器任务-45)
6. [开启 RLS 并配置策略（任务 4.6）](#6-开启-rls-并配置策略任务-46)
7. [启用 Realtime（任务 4.7）](#7-启用-realtime任务-47)
8. [配置本地环境变量](#8-配置本地环境变量)
9. [验证清单](#9-验证清单)

---

## 1. 注册账号与创建项目（任务 4.1）

### 步骤

1. 打开浏览器，访问 https://supabase.com
2. 点击 **Start your project**（或 Sign Up）
3. 使用 GitHub 账号登录（推荐），或使用邮箱注册
4. 登录后进入 Dashboard，点击 **New Project**
5. 填写项目信息：
   - **Organization**：选择你的个人组织（首次会自动创建）
   - **Project Name**：`mya-assistant`
   - **Database Password**：设置一个强密码（⚠️ 请妥善保存，后续可能用到）
   - **Region**：选择 **Southeast Asia (Singapore)** — 延迟最低
   - **Pricing Plan**：Free 即可
6. 点击 **Create new project**，等待 1~2 分钟初始化完成

### 获取凭证

项目创建完成后：

1. 进入项目 Dashboard
2. 点击左侧菜单 **Settings** → **API**
3. 记录以下两个值：
   - **Project URL**：形如 `https://xxxxxxxx.supabase.co`
   - **anon public key**：形如 `eyJhbGciOiJIUzI1NiIs...`（在 `Project API keys` 部分的 `anon` `public` 那个）

> ⚠️ **不要使用 `service_role` key**，那是管理员权限密钥，只用 `anon` key。

### 验收

- [x] Supabase Dashboard 可正常访问
- [x] 获得 Project URL 和 anon key

---

## 2. 创建 schedules 表（任务 4.2）

### 步骤

1. 在 Supabase Dashboard 左侧菜单点击 **SQL Editor**
2. 点击 **New query**
3. 粘贴以下 SQL 并执行（点击 **Run** 按钮）：

```sql
-- ============================================
-- 创建 schedules 表（日程）
-- ============================================
CREATE TABLE schedules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  start_time  TIMESTAMPTZ NOT NULL,
  end_time    TIMESTAMPTZ NOT NULL,
  all_day     BOOLEAN NOT NULL DEFAULT false,
  remind_at   TEXT[] NOT NULL DEFAULT '{}',
  repeat_rule TEXT,
  status      TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'cancelled')),
  color       TEXT,
  tags        TEXT[] NOT NULL DEFAULT '{}',
  _deleted    BOOLEAN NOT NULL DEFAULT false,
  _version    INTEGER NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 创建常用索引
CREATE INDEX idx_schedules_user_id ON schedules (user_id);
CREATE INDEX idx_schedules_start_time ON schedules (start_time);
CREATE INDEX idx_schedules_status ON schedules (status);

-- 添加表注释
COMMENT ON TABLE schedules IS '日程表';
```

### 验收

执行完成后，点击左侧 **Table Editor**，应能看到 `schedules` 表，字段如下：

| 字段 | 类型 | 可空 | 默认值 |
|------|------|------|--------|
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | NO | — |
| title | text | NO | — |
| description | text | YES | — |
| start_time | timestamptz | NO | — |
| end_time | timestamptz | NO | — |
| all_day | boolean | NO | false |
| remind_at | text[] | NO | '{}' |
| repeat_rule | text | YES | — |
| status | text | NO | 'active' |
| color | text | YES | — |
| tags | text[] | NO | '{}' |
| _deleted | boolean | NO | false |
| _version | integer | NO | 1 |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |

---

## 3. 创建 todos 表（任务 4.3）

### 步骤

在 SQL Editor 中新建查询，粘贴以下 SQL 并执行：

```sql
-- ============================================
-- 创建 todos 表（待办事项）
-- ============================================
CREATE TABLE todos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  title       TEXT NOT NULL,
  note        TEXT,
  due_date    TIMESTAMPTZ,
  priority    SMALLINT NOT NULL DEFAULT 1
                CHECK (priority IN (0, 1, 2)),
  done        BOOLEAN NOT NULL DEFAULT false,
  done_at     TIMESTAMPTZ,
  schedule_id UUID REFERENCES schedules(id) ON DELETE SET NULL,
  parent_id   UUID REFERENCES todos(id) ON DELETE SET NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  tags        TEXT[] NOT NULL DEFAULT '{}',
  _deleted    BOOLEAN NOT NULL DEFAULT false,
  _version    INTEGER NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 创建常用索引
CREATE INDEX idx_todos_user_id ON todos (user_id);
CREATE INDEX idx_todos_schedule_id ON todos (schedule_id);
CREATE INDEX idx_todos_parent_id ON todos (parent_id);
CREATE INDEX idx_todos_due_date ON todos (due_date);
CREATE INDEX idx_todos_done ON todos (done);

-- 添加表注释
COMMENT ON TABLE todos IS '待办事项表';
```

### 验收

在 Table Editor 中确认 `todos` 表存在，关键检查点：

- `priority` 字段有 CHECK 约束：只允许 0、1、2
- `schedule_id` 外键指向 `schedules(id)`，删除时 SET NULL
- `parent_id` 自引用外键指向 `todos(id)`，删除时 SET NULL

---

## 4. 创建 notes 表（任务 4.4）

### 步骤

在 SQL Editor 中新建查询，粘贴以下 SQL 并执行：

```sql
-- ============================================
-- 创建 notes 表（快速记录）
-- ============================================
CREATE TABLE notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  content     TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'memo'
                CHECK (type IN ('idea', 'memo', 'log')),
  images      TEXT[] NOT NULL DEFAULT '{}',
  pinned      BOOLEAN NOT NULL DEFAULT false,
  tags        TEXT[] NOT NULL DEFAULT '{}',
  _deleted    BOOLEAN NOT NULL DEFAULT false,
  _version    INTEGER NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 创建常用索引
CREATE INDEX idx_notes_user_id ON notes (user_id);
CREATE INDEX idx_notes_type ON notes (type);
CREATE INDEX idx_notes_pinned ON notes (pinned);

-- 添加表注释
COMMENT ON TABLE notes IS '快速记录表';
```

### 验收

在 Table Editor 中确认 `notes` 表存在，`type` 字段有 CHECK 约束：只允许 'idea'、'memo'、'log'。

---

## 5. 创建 updated_at 自动更新触发器（任务 4.5）

### 说明

每次更新记录时，`updated_at` 字段需要自动刷新为当前时间。Supabase 提供了 `moddatetime` 扩展来实现这个功能。

### 步骤

在 SQL Editor 中新建查询，粘贴以下 SQL 并执行：

```sql
-- ============================================
-- 启用 moddatetime 扩展
-- ============================================
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

-- ============================================
-- 为三张表创建 updated_at 自动更新触发器
-- ============================================

-- schedules 表
CREATE TRIGGER handle_updated_at_schedules
  BEFORE UPDATE ON schedules
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- todos 表
CREATE TRIGGER handle_updated_at_todos
  BEFORE UPDATE ON todos
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- notes 表
CREATE TRIGGER handle_updated_at_notes
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime(updated_at);
```

### 验收

验证触发器是否生效：

1. 在 SQL Editor 中执行以下测试（用一个假 user_id）：

```sql
-- 插入一条测试数据
INSERT INTO notes (user_id, content, type)
VALUES ('00000000-0000-0000-0000-000000000001', '测试 updated_at 触发器', 'memo')
RETURNING id, created_at, updated_at;

-- 记下返回的 id，然后等几秒执行更新
-- 把下面的 <返回的id> 替换成实际的 id 值
UPDATE notes SET content = '已更新' WHERE id = '<返回的id>'
RETURNING id, created_at, updated_at;
```

2. 确认 `updated_at` 时间已更新（比 `created_at` 更晚）
3. 测试完成后删除测试数据：

```sql
DELETE FROM notes WHERE user_id = '00000000-0000-0000-0000-000000000001';
```

---

## 6. 开启 RLS 并配置策略（任务 4.6）

### 说明

Row Level Security (RLS) 确保每个用户只能访问自己的数据。规则是：所有 SELECT / INSERT / UPDATE / DELETE 操作都要求 `auth.uid() = user_id`。

> ⚠️ **注意**：Phase 0 暂未接入 Auth（属于 Phase 1 范围），开启 RLS 后未认证用户将无法访问数据。为了 Phase 0 的接入验证（任务 5.4~5.6），我们额外添加一条**临时开发策略**，允许匿名访问。**Phase 1 接入 Auth 后必须删除此临时策略。**

### 步骤

在 SQL Editor 中新建查询，粘贴以下 SQL 并执行：

```sql
-- ============================================
-- 开启 RLS
-- ============================================
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 正式策略：已认证用户仅可访问自己的数据
-- ============================================

-- schedules
CREATE POLICY "schedules_select" ON schedules
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "schedules_insert" ON schedules
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "schedules_update" ON schedules
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "schedules_delete" ON schedules
  FOR DELETE USING (auth.uid() = user_id);

-- todos
CREATE POLICY "todos_select" ON todos
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "todos_insert" ON todos
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "todos_update" ON todos
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "todos_delete" ON todos
  FOR DELETE USING (auth.uid() = user_id);

-- notes
CREATE POLICY "notes_select" ON notes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notes_insert" ON notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notes_update" ON notes
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notes_delete" ON notes
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- ⚠️ 临时开发策略（Phase 1 接入 Auth 后删除！）
-- 允许匿名 anon key 在开发阶段访问数据
-- ============================================

CREATE POLICY "dev_schedules_all" ON schedules
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "dev_todos_all" ON todos
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "dev_notes_all" ON notes
  FOR ALL USING (true) WITH CHECK (true);
```

### 验收

1. 在左侧菜单点击 **Authentication** → **Policies**
2. 确认三张表各有 **5 条策略**（4 条正式 + 1 条临时开发）
3. RLS 标记为已开启（表名旁有盾牌图标 🛡️）

> 📌 **提醒**：Phase 1 接入 Auth 后，务必执行以下 SQL 删除临时策略：
> ```sql
> DROP POLICY "dev_schedules_all" ON schedules;
> DROP POLICY "dev_todos_all" ON todos;
> DROP POLICY "dev_notes_all" ON notes;
> ```

---

## 7. 启用 Realtime（任务 4.7）

### 步骤

**方式一：通过 Dashboard UI（推荐）**

1. 在 Supabase Dashboard 左侧菜单点击 **Database**
2. 点击 **Replication**（复制）
3. 找到 **supabase_realtime** 发布源
4. 点击右侧的 **Source** 管理按钮
5. 在表列表中找到 `schedules`、`todos`、`notes`，**分别打开开关**
6. 保存

**方式二：通过 SQL**

如果 Dashboard 界面找不到上述选项，也可以在 SQL Editor 中执行：

```sql
-- 将三张表添加到 realtime 发布
ALTER PUBLICATION supabase_realtime ADD TABLE schedules;
ALTER PUBLICATION supabase_realtime ADD TABLE todos;
ALTER PUBLICATION supabase_realtime ADD TABLE notes;
```

### 验收

回到 **Database** → **Replication** 页面，确认 `schedules`、`todos`、`notes` 三张表都显示在 realtime 发布列表中。

---

## 8. 配置本地环境变量

完成以上所有 Supabase 配置后，回到本地项目：

1. 复制环境变量模板：

```powershell
# 在项目根目录执行
Copy-Item .env.example .env.local
```

2. 编辑 `.env.local`，填入你的 Supabase 凭证：

```env
SUPABASE_URL=https://你的项目ID.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...你的anon_key...
```

3. 确认 `.env.local` 已被 `.gitignore` 忽略（不会被提交到 Git）

---

## 9. 验证清单

完成所有步骤后，对照以下清单确认：

| # | 任务 | 检查项 | 状态 |
|---|------|--------|------|
| 4.1 | 注册账号 | Dashboard 可访问，Project URL 和 anon key 已获取 | ☐ |
| 4.2 | schedules 表 | Table Editor 中可见，17 个字段，status CHECK 约束正常 | ☐ |
| 4.3 | todos 表 | Table Editor 中可见，priority CHECK 约束正常，两个外键正常 | ☐ |
| 4.4 | notes 表 | Table Editor 中可见，type CHECK 约束正常 | ☐ |
| 4.5 | 触发器 | 更新记录后 updated_at 自动刷新 | ☐ |
| 4.6 | RLS | 三张表 RLS 已开启，每表 5 条策略 | ☐ |
| 4.7 | Realtime | Replication 页面三张表已启用 | ☐ |
| — | 环境变量 | `.env.local` 已配置，包含正确的 URL 和 Key | ☐ |

**全部完成后回来告诉我，我会继续实施任务组 5（移动端初始化与接入验证）！** 🎉

---

## 附录：一键执行 SQL（可选）

如果你希望一次性执行所有建表 SQL，可以把以下完整脚本复制到 SQL Editor 一次性运行：

<details>
<summary>点击展开完整 SQL 脚本</summary>

```sql
-- ============================================
-- Mya Assistant - Phase 0 数据库初始化脚本
-- ============================================

-- 1. 创建 schedules 表
CREATE TABLE schedules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  start_time  TIMESTAMPTZ NOT NULL,
  end_time    TIMESTAMPTZ NOT NULL,
  all_day     BOOLEAN NOT NULL DEFAULT false,
  remind_at   TEXT[] NOT NULL DEFAULT '{}',
  repeat_rule TEXT,
  status      TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'cancelled')),
  color       TEXT,
  tags        TEXT[] NOT NULL DEFAULT '{}',
  _deleted    BOOLEAN NOT NULL DEFAULT false,
  _version    INTEGER NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_schedules_user_id ON schedules (user_id);
CREATE INDEX idx_schedules_start_time ON schedules (start_time);
CREATE INDEX idx_schedules_status ON schedules (status);
COMMENT ON TABLE schedules IS '日程表';

-- 2. 创建 todos 表
CREATE TABLE todos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  title       TEXT NOT NULL,
  note        TEXT,
  due_date    TIMESTAMPTZ,
  priority    SMALLINT NOT NULL DEFAULT 1
                CHECK (priority IN (0, 1, 2)),
  done        BOOLEAN NOT NULL DEFAULT false,
  done_at     TIMESTAMPTZ,
  schedule_id UUID REFERENCES schedules(id) ON DELETE SET NULL,
  parent_id   UUID REFERENCES todos(id) ON DELETE SET NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  tags        TEXT[] NOT NULL DEFAULT '{}',
  _deleted    BOOLEAN NOT NULL DEFAULT false,
  _version    INTEGER NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_todos_user_id ON todos (user_id);
CREATE INDEX idx_todos_schedule_id ON todos (schedule_id);
CREATE INDEX idx_todos_parent_id ON todos (parent_id);
CREATE INDEX idx_todos_due_date ON todos (due_date);
CREATE INDEX idx_todos_done ON todos (done);
COMMENT ON TABLE todos IS '待办事项表';

-- 3. 创建 notes 表
CREATE TABLE notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  content     TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'memo'
                CHECK (type IN ('idea', 'memo', 'log')),
  images      TEXT[] NOT NULL DEFAULT '{}',
  pinned      BOOLEAN NOT NULL DEFAULT false,
  tags        TEXT[] NOT NULL DEFAULT '{}',
  _deleted    BOOLEAN NOT NULL DEFAULT false,
  _version    INTEGER NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notes_user_id ON notes (user_id);
CREATE INDEX idx_notes_type ON notes (type);
CREATE INDEX idx_notes_pinned ON notes (pinned);
COMMENT ON TABLE notes IS '快速记录表';

-- 4. 启用 moddatetime 扩展 + 创建触发器
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

CREATE TRIGGER handle_updated_at_schedules
  BEFORE UPDATE ON schedules
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE TRIGGER handle_updated_at_todos
  BEFORE UPDATE ON todos
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE TRIGGER handle_updated_at_notes
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- 5. 开启 RLS
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- 6. 正式 RLS 策略
CREATE POLICY "schedules_select" ON schedules
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "schedules_insert" ON schedules
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "schedules_update" ON schedules
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "schedules_delete" ON schedules
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "todos_select" ON todos
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "todos_insert" ON todos
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "todos_update" ON todos
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "todos_delete" ON todos
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "notes_select" ON notes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notes_insert" ON notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notes_update" ON notes
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notes_delete" ON notes
  FOR DELETE USING (auth.uid() = user_id);

-- 7. 临时开发策略（Phase 1 接入 Auth 后删除！）
CREATE POLICY "dev_schedules_all" ON schedules
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_todos_all" ON todos
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_notes_all" ON notes
  FOR ALL USING (true) WITH CHECK (true);

-- 8. 启用 Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE schedules;
ALTER PUBLICATION supabase_realtime ADD TABLE todos;
ALTER PUBLICATION supabase_realtime ADD TABLE notes;
```

</details>
