import React, { useEffect, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTodosStore } from '@mya/shared'
import type { TodoTreeNode } from '@mya/shared'
import { useTheme } from '../../theme'
import { TodoCard } from '../../components/TodoCard'
import { EmptyState } from '../../components/EmptyState'

export function TodosListScreen({ navigation }: { navigation: any }) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  const todos = useTodosStore((s) => s.todos)
  const loading = useTodosStore((s) => s.loading)
  const showCompleted = useTodosStore((s) => s.showCompleted)
  const expandedParents = useTodosStore((s) => s.expandedParents)
  const fetchTodos = useTodosStore((s) => s.fetchTodos)
  const toggleDone = useTodosStore((s) => s.toggleDone)
  const deleteTodo = useTodosStore((s) => s.deleteTodo)
  const toggleExpandParent = useTodosStore((s) => s.toggleExpandParent)
  const setShowCompleted = useTodosStore((s) => s.setShowCompleted)
  const subscribeRealtime = useTodosStore((s) => s.subscribeRealtime)
  const todoTreeFn = useTodosStore((s) => s.todoTree)
  const completedTodosFn = useTodosStore((s) => s.completedTodos)

  // 加载数据和订阅实时变更
  useEffect(() => {
    fetchTodos()
    const unsubscribe = subscribeRealtime()
    return () => unsubscribe()
  }, [fetchTodos, subscribeRealtime])

  // 依赖 todos 数组确保数据变化时重新计算
  const treeData = useMemo(() => todoTreeFn(), [todos, todoTreeFn])
  const completed = useMemo(() => completedTodosFn(), [todos, completedTodosFn])

  // 导航到编辑页面
  const handlePress = useCallback((id: string) => {
    navigation.navigate('TodoForm', { todoId: id })
  }, [navigation])

  // 导航到创建页面
  const handleCreate = useCallback(() => {
    navigation.navigate('TodoForm', {})
  }, [navigation])

  // 渲染进行中的待办树
  const renderTodoTree = () => {
    if (treeData.length === 0 && completed.length === 0) {
      return (
        <EmptyState
          icon="✅"
          title="暂无待办"
          description="点击右下角按钮创建第一条待办事项"
        />
      )
    }

    return (
      <FlatList
        data={treeData}
        keyExtractor={(item) => item.todo.id}
        renderItem={({ item }: { item: TodoTreeNode }) => renderTreeNode(item)}
        ListFooterComponent={renderCompletedSection}
        contentContainerStyle={{
          paddingTop: theme.spacing.sm,
          paddingHorizontal: theme.spacing.md,
          paddingBottom: 80,
        }}
        showsVerticalScrollIndicator={false}
      />
    )
  }

  // 渲染单个树节点（父任务 + 子任务）
  const renderTreeNode = (node: TodoTreeNode) => {
    const isExpanded = expandedParents.has(node.todo.id)
    const childrenCount = node.children.length
    const completedChildrenCount = node.children.filter((c) => c.done).length

    return (
      <View key={node.todo.id}>
        <TodoCard
          todo={node.todo}
          childrenCount={childrenCount}
          completedChildrenCount={completedChildrenCount}
          onPress={handlePress}
          onToggleDone={toggleDone}
          onDelete={deleteTodo}
          onToggleExpand={toggleExpandParent}
          isExpanded={isExpanded}
        />
        {/* 展开时显示子任务 */}
        {isExpanded && node.children.map((child) => (
          <TodoCard
            key={child.id}
            todo={child}
            onPress={handlePress}
            onToggleDone={toggleDone}
            onDelete={deleteTodo}
            isChild
          />
        ))}
      </View>
    )
  }

  // 渲染已完成区域
  const renderCompletedSection = () => {
    if (completed.length === 0) return null

    return (
      <View style={{ marginTop: theme.spacing.md }}>
        <TouchableOpacity
          style={[
            styles.sectionHeader,
            { paddingVertical: theme.spacing.sm },
          ]}
          onPress={() => setShowCompleted(!showCompleted)}
          activeOpacity={0.7}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            {showCompleted ? '▾' : '▸'} 已完成（{completed.length}）
          </Text>
        </TouchableOpacity>

        {showCompleted && completed.map((node) => renderTreeNode(node))}
      </View>
    )
  }

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
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: theme.colors.text, fontSize: theme.fontSize.xl }]}>
          待办
        </Text>
      </View>

      {/* 列表 */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        renderTodoTree()
      )}

      {/* FAB 创建按钮 */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: theme.colors.primary,
            bottom: insets.bottom + theme.spacing.md,
            right: theme.spacing.md,
          },
        ]}
        onPress={handleCreate}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {},
  headerTitle: {
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 30,
  },
})
