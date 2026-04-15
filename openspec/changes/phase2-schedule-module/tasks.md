## 1. 共享层类型定义

- [ ] 1.1 在 `packages/shared/src/models/schedule.ts` 中新增 `CreateScheduleInput`、`UpdateScheduleInput` 类型导出。验收：TypeScript 编译通过，两个类型可从 `@mya/shared` 导入
- [ ] 1.2 在 `packages/shared/src/models/index.ts` 和 `packages/shared/src/index.ts` 中补充新类型的导出。验收：`import { CreateScheduleInput, UpdateScheduleInput } from '@mya/shared'` 正常工作

## 2. 共享层 useSchedulesStore

- [ ] 2.1 创建 `packages/shared/src/stores/schedules-store.ts`，实现 `SchedulesState` 和 `SchedulesActions` 接口定义（状态：`schedules`、`loading`、`selectedDate`）。验收：接口定义完整，TypeScript 编译通过
- [ ] 2.2 实现 `fetchSchedules(month)`：通过 `SupabaseAdapter<Schedule>` 拉取指定月份的日程（使用 filter 按 `start_time` 范围查询），按 `start_time` 升序排列，管理 `loading` 状态。验收：调用后 `schedules` 数组正确填充对应月份的数据
- [ ] 2.3 实现 `createSchedule(data)`：创建日程，设置默认值（`status: 'active'`、`all_day: false`）。验收：创建后本地列表包含新记录，后端数据正确
- [ ] 2.4 实现 `updateSchedule(id, data)`：部分更新日程字段。验收：更新后本地列表对应记录反映最新值
- [ ] 2.5 实现 `deleteSchedule(id)`：软删除日程。验收：本地列表移除该日程
- [ ] 2.6 实现 `cancelSchedule(id)` 和 `restoreSchedule(id)`：切换日程状态（`active` ↔ `cancelled`）。验收：`status` 字段正确切换
- [ ] 2.7 实现 `setSelectedDate(date)` 和 `schedulesForDate(date)`：选中日期管理和按日筛选（全天事件优先 + `start_time` 升序）。验收：返回的日程列表排序正确
- [ ] 2.8 实现 `markedDates()`：返回有日程日期的标记对象（`{ marked: true, dotColor: string }`），供月历组件使用。验收：返回的对象 key 为日期字符串，value 包含正确标记
- [ ] 2.9 实现 `subscribeRealtime()`：订阅 schedules 表的 Realtime 事件，处理 INSERT/UPDATE/DELETE，含 ID 去重。验收：其他端操作后本地列表自动更新
- [ ] 2.10 在 `packages/shared/src/stores/index.ts` 和 `packages/shared/src/index.ts` 中导出 `useSchedulesStore`。验收：`import { useSchedulesStore } from '@mya/shared'` 正常工作

## 3. 移动端依赖安装

- [ ] 3.1 安装 `react-native-calendars` 到 `packages/mobile`。验收：`pnpm install` 成功，Android 构建正常

## 4. 移动端基础组件

- [ ] 4.1 创建 `packages/mobile/src/components/TimePicker.tsx`：时间选择组件，点击弹出原生时间选择器（`@react-native-community/datetimepicker`，`mode="time"`），显示格式化时间 `HH:mm`，接收 `value` 和 `onChange` props。验收：选择时间后返回更新的 ISO 字符串
- [ ] 4.2 创建 `packages/mobile/src/components/ColorPicker.tsx`：颜色选择组件，展示 8 种预设颜色色块（横向排列），选中显示勾选标记，支持取消选择（设为 null），接收 `value` 和 `onChange` props。验收：点击色块触发 onChange，选中态显示勾选
- [ ] 4.3 创建 `packages/mobile/src/components/RemindPicker.tsx`：提醒选择组件，展示预设选项（无/事件时/5分钟/15分钟/30分钟/1小时/1天），支持多选，选择「无提醒」清除其他选择，接收 `value`（number[]）和 `onChange` props。验收：多选逻辑正确，选择「无提醒」清空列表
- [ ] 4.4 创建 `packages/mobile/src/components/ScheduleCard.tsx`：日程卡片组件，显示颜色指示条、时间（全天显示「全天」/有时间显示 HH:mm-HH:mm）、标题（取消时删除线+灰色）、描述预览、提醒图标。支持点击（编辑）和长按（操作菜单）。验收：各状态样式正确，交互触发正确回调
- [ ] 4.5 在 `packages/mobile/src/components/index.ts` 中导出新组件（TimePicker、ColorPicker、RemindPicker、ScheduleCard）。验收：`import { TimePicker, ColorPicker, RemindPicker, ScheduleCard } from '../components'` 正常工作

## 5. 移动端页面

- [ ] 5.1 创建 `packages/mobile/src/screens/schedules/SchedulesScreen.tsx`：日程主页面，上半部分月历视图（react-native-calendars 的 Calendar 组件，显示标记点、当日高亮、选中日期），下半部分为选中日期的日程列表（ScheduleCard），含 FAB 创建按钮、加载态、空状态。切换月份时自动加载数据。验收：月历正确显示，点击日期切换列表，标记点正确
- [ ] 5.2 创建 `packages/mobile/src/screens/schedules/ScheduleFormScreen.tsx`：日程表单页面，支持创建和编辑模式，包含标题输入、描述输入、全天开关、开始/结束日期时间选择（全天模式仅日期）、RemindPicker、ColorPicker。含标题为空校验和时间校验（结束时间不早于开始时间）。验收：创建模式空表单（默认时间为选中日期下一整点 +1h），编辑模式填充已有数据，校验拦截正确，保存成功后返回

## 6. 导航集成

- [ ] 6.1 在 `packages/mobile/src/navigation/types.ts` 中新增 `ScheduleStackParamList` 类型定义（`SchedulesList`、`ScheduleForm: { scheduleId?: string, selectedDate?: string }`）。验收：TypeScript 类型正确
- [ ] 6.2 修改 `packages/mobile/src/navigation/MainTab.tsx`，新增 `ScheduleStack` 嵌套导航（SchedulesScreen + ScheduleFormScreen），将日程 Tab 的 `PlaceholderScreen` 替换为 `ScheduleStackScreen`。验收：点击日程 Tab 显示日程主页面，可正确导航到表单页

## 7. 验收与收尾

- [ ] 7.1 TypeScript 全量类型检查通过（`pnpm run typecheck`）。验收：无类型错误
- [ ] 7.2 移动端 Android 构建并在模拟器运行日程完整流程：月历浏览 → 创建日程 → 查看列表 → 编辑 → 取消/恢复 → 删除。验收：所有操作正常，数据与后端同步
