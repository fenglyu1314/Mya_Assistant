import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Text } from 'react-native'
import { useTheme } from '../theme'
import { NotesListScreen } from '../screens/notes/NotesListScreen'
import { CreateNoteScreen } from '../screens/notes/CreateNoteScreen'
import { TodosListScreen } from '../screens/todos/TodosListScreen'
import { TodoFormScreen } from '../screens/todos/TodoFormScreen'
import { SchedulesScreen } from '../screens/schedules/SchedulesScreen'
import { ScheduleFormScreen } from '../screens/schedules/ScheduleFormScreen'
import { SettingsScreen } from '../screens/settings/SettingsScreen'
import type { MainTabParamList, NotesStackParamList, TodosStackParamList, ScheduleStackParamList } from './types'

const Tab = createBottomTabNavigator<MainTabParamList>()
const NotesStack = createNativeStackNavigator<NotesStackParamList>()
const TodosStack = createNativeStackNavigator<TodosStackParamList>()
const ScheduleStack = createNativeStackNavigator<ScheduleStackParamList>()

// Tab 图标映射
const TAB_ICONS: Record<keyof MainTabParamList, string> = {
  Notes: '📝',
  Todos: '✅',
  Schedule: '📅',
  Settings: '⚙️',
}

// Tab 标签映射
const TAB_LABELS: Record<keyof MainTabParamList, string> = {
  Notes: '快速记录',
  Todos: '待办',
  Schedule: '日程',
  Settings: '设置',
}

// Notes Tab 嵌套导航（列表 + 创建）
function NotesStackScreen() {
  return (
    <NotesStack.Navigator screenOptions={{ headerShown: false }}>
      <NotesStack.Screen name="NotesList" component={NotesListScreen} />
      <NotesStack.Screen
        name="CreateNote"
        component={CreateNoteScreen}
        options={{ presentation: 'modal' }}
      />
    </NotesStack.Navigator>
  )
}

// Todos Tab 嵌套导航（列表 + 表单）
function TodosStackScreen() {
  return (
    <TodosStack.Navigator screenOptions={{ headerShown: false }}>
      <TodosStack.Screen name="TodosList" component={TodosListScreen} />
      <TodosStack.Screen
        name="TodoForm"
        component={TodoFormScreen}
        options={{ presentation: 'modal' }}
      />
    </TodosStack.Navigator>
  )
}

// Schedule Tab 嵌套导航（日程列表 + 日程表单）
function ScheduleStackScreen() {
  return (
    <ScheduleStack.Navigator screenOptions={{ headerShown: false }}>
      <ScheduleStack.Screen name="SchedulesList" component={SchedulesScreen} />
      <ScheduleStack.Screen
        name="ScheduleForm"
        component={ScheduleFormScreen}
        options={{ presentation: 'modal' }}
      />
    </ScheduleStack.Navigator>
  )
}

export function MainTab() {
  const theme = useTheme()

  return (
    <Tab.Navigator
      initialRouteName="Notes"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarLabel: TAB_LABELS[route.name as keyof MainTabParamList],
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>
            {TAB_ICONS[route.name as keyof MainTabParamList]}
          </Text>
        ),
      })}
    >
      <Tab.Screen name="Notes" component={NotesStackScreen} />
      <Tab.Screen name="Todos" component={TodosStackScreen} />
      <Tab.Screen name="Schedule" component={ScheduleStackScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  )
}
