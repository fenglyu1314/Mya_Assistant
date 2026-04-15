import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTodosStore } from '@mya/shared'
import type { Todo, TodoPriority } from '@mya/shared'
import { useTheme } from '../../theme'
import { Button } from '../../components/Button'
import { TextInput } from '../../components/TextInput'
import { PriorityPicker } from '../../components/PriorityPicker'
import { DatePicker } from '../../components/DatePicker'

interface TodoFormScreenProps {
  navigation: any
  route: {
    params?: {
      todoId?: string
    }
  }
}

export function TodoFormScreen({ navigation, route }: TodoFormScreenProps) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const todoId = route.params?.todoId

  const todos = useTodosStore((s) => s.todos)
  const createTodo = useTodosStore((s) => s.createTodo)
  const updateTodo = useTodosStore((s) => s.updateTodo)

  const isEdit = !!todoId
  const existingTodo = isEdit ? todos.find((t) => t.id === todoId) : null

  // 表单状态
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [dueDate, setDueDate] = useState<string | null>(null)
  const [priority, setPriority] = useState<TodoPriority>(0)
  const [parentId, setParentId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // 编辑模式下填充已有数据
  useEffect(() => {
    if (existingTodo) {
      setTitle(existingTodo.title)
      setNote(existingTodo.note ?? '')
      setDueDate(existingTodo.due_date)
      setPriority(existingTodo.priority)
      setParentId(existingTodo.parent_id)
    }
  }, [existingTodo])

  // 获取可选的父任务列表（未完成的顶级待办，排除自身）
  const availableParents = todos.filter(
    (t) => !t.done && !t.parent_id && t.id !== todoId
  )

  const handleSave = useCallback(async () => {
    // 标题校验
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      Alert.alert('提示', '标题不能为空')
      return
    }

    setSaving(true)
    try {
      if (isEdit && todoId) {
        await updateTodo(todoId, {
          title: trimmedTitle,
          note: note.trim() || null,
          due_date: dueDate,
          priority,
        })
      } else {
        await createTodo({
          title: trimmedTitle,
          note: note.trim() || undefined,
          due_date: dueDate ?? undefined,
          priority,
          parent_id: parentId ?? undefined,
        })
      }
      navigation.goBack()
    } catch (err) {
      console.error('[TodoForm] 保存失败:', err)
      Alert.alert('错误', `${isEdit ? '保存' : '创建'}失败: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSaving(false)
    }
  }, [title, note, dueDate, priority, parentId, isEdit, todoId, createTodo, updateTodo, navigation])

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* 标题栏 */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + theme.spacing.sm,
            paddingHorizontal: theme.spacing.md,
            paddingBottom: theme.spacing.sm,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <Text
          style={[styles.backBtn, { color: theme.colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          ← 返回
        </Text>
        <Text style={[styles.headerTitle, { color: theme.colors.text, fontSize: theme.fontSize.lg }]}>
          {isEdit ? '编辑待办' : '新建待办'}
        </Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        style={styles.form}
        contentContainerStyle={{
          padding: theme.spacing.md,
          gap: theme.spacing.lg,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* 标题 */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
            标题 <Text style={{ color: theme.colors.error }}>*</Text>
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="输入待办标题"
          />
        </View>

        {/* 备注 */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>备注</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="添加备注信息（可选）"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* 截止日期 */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>截止日期</Text>
          <DatePicker value={dueDate} onChange={setDueDate} />
        </View>

        {/* 优先级 */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>优先级</Text>
          <PriorityPicker value={priority} onChange={setPriority} />
        </View>

        {/* 父任务选择（仅创建模式且有可选父任务时显示） */}
        {!isEdit && availableParents.length > 0 && (
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>父任务（可选）</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {/* 无父任务选项 */}
              <Text
                style={[
                  styles.parentChip,
                  {
                    backgroundColor: !parentId ? theme.colors.primary : theme.colors.surface,
                    color: !parentId ? '#FFFFFF' : theme.colors.textSecondary,
                    borderColor: !parentId ? theme.colors.primary : theme.colors.border,
                    borderRadius: theme.borderRadius.md,
                  },
                ]}
                onPress={() => setParentId(null)}
              >
                无
              </Text>
              {availableParents.map((p) => (
                <Text
                  key={p.id}
                  style={[
                    styles.parentChip,
                    {
                      backgroundColor: parentId === p.id ? theme.colors.primary : theme.colors.surface,
                      color: parentId === p.id ? '#FFFFFF' : theme.colors.textSecondary,
                      borderColor: parentId === p.id ? theme.colors.primary : theme.colors.border,
                      borderRadius: theme.borderRadius.md,
                    },
                  ]}
                  onPress={() => setParentId(p.id)}
                  numberOfLines={1}
                >
                  {p.title}
                </Text>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 保存按钮 */}
        <Button
          title={saving ? '保存中...' : (isEdit ? '保存' : '创建')}
          onPress={handleSave}
          disabled={saving}
        />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    fontSize: 16,
    fontWeight: '500',
    width: 50,
  },
  headerTitle: {
    fontWeight: '700',
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  parentChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    overflow: 'hidden',
    fontSize: 13,
  },
})
