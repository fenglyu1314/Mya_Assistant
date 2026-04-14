import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Text } from 'react-native'
import { useTheme } from '../theme'
import { NotesListScreen } from '../screens/notes/NotesListScreen'
import { CreateNoteScreen } from '../screens/notes/CreateNoteScreen'
import { PlaceholderScreen } from '../screens/PlaceholderScreen'
import { SettingsScreen } from '../screens/settings/SettingsScreen'
import type { MainTabParamList, NotesStackParamList } from './types'

const Tab = createBottomTabNavigator<MainTabParamList>()
const NotesStack = createNativeStackNavigator<NotesStackParamList>()

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
      <Tab.Screen
        name="Todos"
        component={PlaceholderScreen}
        initialParams={{ title: '待办事项', description: '即将推出' } as never}
      />
      <Tab.Screen
        name="Schedule"
        component={PlaceholderScreen}
        initialParams={{ title: '日程管理', description: '即将推出' } as never}
      />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  )
}
