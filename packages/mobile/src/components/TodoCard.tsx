import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native'
import type { Todo, TodoPriority } from '@mya/shared'
import { useTheme } from '../theme'

export interface TodoCardProps {
  todo: Todo
  childrenCount?: number
  completedChildrenCount?: number
  onPress: (id: string) => void
  onToggleDone: (id: string) => void
  onDelete: (id: string) => void
  onToggleExpand?: (id: string) => void
  isExpanded?: boolean
  isChild?: boolean
}

// 优先级对应的颜色
const PRIORITY_COLORS: Record<TodoPriority, string> = {
  0: 'transparent',   // 低 — 无指示条
  1: '#F39C12',       // 中 — 橙色
  2: '#E74C3C',       // 高 — 红色
}

// 判断是否过期
function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false
  const due = new Date(dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return due < today
}

// 格式化日期
function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${month}-${day}`
}

export function TodoCard({
  todo,
  childrenCount = 0,
  completedChildrenCount = 0,
  onPress,
  onToggleDone,
  onDelete,
  onToggleExpand,
  isExpanded,
  isChild = false,
}: TodoCardProps) {
  const theme = useTheme()
  const overdue = !todo.done && isOverdue(todo.due_date)
  const priorityColor = PRIORITY_COLORS[todo.priority]

  const handleLongPress = () => {
    Alert.alert(
      '确认删除',
      `确定要删除「${todo.title}」吗？${childrenCount > 0 ? `\n将同时删除 ${childrenCount} 个子任务` : ''}`,
      [
        { text: '取消', style: 'cancel' },
        { text: '删除', style: 'destructive', onPress: () => onDelete(todo.id) },
      ]
    )
  }

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.md,
          borderColor: theme.colors.border,
          borderLeftColor: priorityColor !== 'transparent' ? priorityColor : theme.colors.border,
          borderLeftWidth: priorityColor !== 'transparent' ? 3 : 1,
          marginLeft: isChild ? 24 : 0,
        },
      ]}
      onPress={() => onPress(todo.id)}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.row}>
        {/* 勾选框 */}
        <TouchableOpacity
          style={[
            styles.checkbox,
            {
              borderColor: todo.done ? theme.colors.success : theme.colors.textSecondary,
              backgroundColor: todo.done ? theme.colors.success : 'transparent',
            },
          ]}
          onPress={() => onToggleDone(todo.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {todo.done && (
            <Text style={styles.checkmark}>✓</Text>
          )}
        </TouchableOpacity>

        {/* 内容区域 */}
        <View style={styles.content}>
          <Text
            style={[
              styles.title,
              {
                color: todo.done ? theme.colors.textSecondary : theme.colors.text,
                textDecorationLine: todo.done ? 'line-through' : 'none',
              },
            ]}
            numberOfLines={1}
          >
            {todo.title}
          </Text>

          {/* 底部标签行 */}
          <View style={styles.tags}>
            {/* 截止日期 */}
            {todo.due_date && (
              <View style={[styles.tag, { backgroundColor: overdue ? '#E74C3C20' : `${theme.colors.border}80` }]}>
                <Text
                  style={[
                    styles.tagText,
                    { color: overdue ? '#E74C3C' : theme.colors.textSecondary },
                  ]}
                >
                  📅 {formatDate(todo.due_date)}
                </Text>
              </View>
            )}

            {/* 子任务计数 — 展开/折叠按钮 */}
            {childrenCount > 0 && (
              <TouchableOpacity
                style={[
                  styles.expandBtn,
                  { backgroundColor: `${theme.colors.primary}15` },
                ]}
                onPress={() => onToggleExpand?.(todo.id)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text style={[styles.expandBtnText, { color: theme.colors.primary }]}>
                  {isExpanded ? '▾' : '▸'} 子任务 {completedChildrenCount}/{childrenCount}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
    // 阴影
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
  },
  tags: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 11,
  },
  expandBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  expandBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
})
