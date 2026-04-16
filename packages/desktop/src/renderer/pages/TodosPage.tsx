import React, { useState, useEffect } from 'react'
import { Plus, Loader2, ChevronDown, ListTodo } from 'lucide-react'
import { useTodosStore } from '@mya/shared'
import type { Todo } from '@mya/shared'
import { Button } from '../components/ui/button'
import { TodoItem } from '../components/todos/TodoItem'
import { TodoFormDialog } from '../components/todos/TodoFormDialog'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { cn } from '../lib/utils'

export function TodosPage() {
  const {
    loading,
    expandedParents,
    showCompleted,
    fetchTodos,
    toggleDone,
    deleteTodo,
    toggleExpandParent,
    setShowCompleted,
    subscribeRealtime,
    todoTree,
    completedTodos,
  } = useTodosStore()

  // Dialog 状态
  const [formOpen, setFormOpen] = useState(false)
  const [editTodo, setEditTodo] = useState<Todo | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // 页面挂载
  useEffect(() => {
    fetchTodos()
    const unsubscribe = subscribeRealtime()
    return () => { unsubscribe() }
  }, [fetchTodos, subscribeRealtime])

  const activeTree = todoTree()
  const completed = completedTodos()

  function handleEdit(todo: Todo) {
    setEditTodo(todo)
    setFormOpen(true)
  }

  function handleCreate() {
    setEditTodo(null)
    setFormOpen(true)
  }

  return (
    <div className="flex h-full flex-col">
      {/* 顶部标题栏 */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">待办</h1>
        <Button onClick={handleCreate} size="sm">
          <Plus className="h-4 w-4" />
          新建待办
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : activeTree.length === 0 && completed.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
          <ListTodo className="mb-3 h-12 w-12" />
          <p className="text-lg font-medium">暂无待办</p>
          <p className="text-sm">点击「新建待办」创建第一条待办吧</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {/* 进行中 */}
          {activeTree.length > 0 && (
            <div className="mb-4">
              <h2 className="mb-2 px-3 text-sm font-medium text-muted-foreground">
                进行中 ({activeTree.length})
              </h2>
              <div className="space-y-0.5">
                {activeTree.map((node) => (
                  <TodoItem
                    key={node.todo.id}
                    node={node}
                    expanded={expandedParents.has(node.todo.id)}
                    onToggleExpand={toggleExpandParent}
                    onToggleDone={toggleDone}
                    onEdit={handleEdit}
                    onDelete={(id) => setDeleteId(id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 已完成 */}
          {completed.length > 0 && (
            <div>
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setShowCompleted(!showCompleted)}
              >
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform',
                    !showCompleted && '-rotate-90',
                  )}
                />
                已完成 ({completed.length})
              </button>
              {showCompleted && (
                <div className="space-y-0.5 opacity-60">
                  {completed.map((node) => (
                    <TodoItem
                      key={node.todo.id}
                      node={node}
                      expanded={expandedParents.has(node.todo.id)}
                      onToggleExpand={toggleExpandParent}
                      onToggleDone={toggleDone}
                      onEdit={handleEdit}
                      onDelete={(id) => setDeleteId(id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 待办表单弹窗 */}
      <TodoFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editTodo={editTodo}
      />

      {/* 删除确认 */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => { if (!open) setDeleteId(null) }}
        title="删除待办"
        description="确定要删除这条待办吗？子任务也会一并删除，此操作不可撤销。"
        confirmText="删除"
        onConfirm={() => {
          if (deleteId) deleteTodo(deleteId)
        }}
      />
    </div>
  )
}
