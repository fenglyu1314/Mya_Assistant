# 桌面端设置页面

> 桌面端设置功能的页面规格。

---

### Requirement: 桌面端设置页面（SettingsPage）
桌面端 SHALL 提供 SettingsPage，替换 SettingsPlaceholder，展示用户信息和提供登出功能：

- 页面标题「设置」
- 用户信息卡片：显示当前登录用户的邮箱地址
- 登出按钮：点击后调用 `useAuthStore.signOut()`，跳转到登录页面
- 登出前显示确认对话框

#### Scenario: 页面展示
- **WHEN** 用户导航到设置页面
- **THEN** 显示用户邮箱和登出按钮

#### Scenario: 登出确认
- **WHEN** 用户点击登出按钮
- **THEN** 显示确认对话框「确定要登出吗？」

#### Scenario: 确认登出
- **WHEN** 用户在确认对话框中点击「确定」
- **THEN** 调用 `signOut()`，成功后跳转到登录页面

#### Scenario: 取消登出
- **WHEN** 用户在确认对话框中点击「取消」
- **THEN** 对话框关闭，保持在设置页面
