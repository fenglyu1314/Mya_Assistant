import React, { useEffect, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNotesStore } from '@mya/shared'
import type { Note, NoteType } from '@mya/shared'
import { useTheme } from '../../theme'
import { Card } from '../../components/Card'
import { EmptyState } from '../../components/EmptyState'

// 分类标签配置
const FILTERS: { key: NoteType | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'idea', label: '灵感' },
  { key: 'memo', label: '备忘' },
  { key: 'log', label: '日志' },
]

// 分类颜色映射
const TYPE_COLORS: Record<NoteType, string> = {
  idea: '#F39C12',
  memo: '#3498DB',
  log: '#2ECC71',
}

// 分类中文名映射
const TYPE_LABELS: Record<NoteType, string> = {
  idea: '灵感',
  memo: '备忘',
  log: '日志',
}

export function NotesListScreen({ navigation }: { navigation: any }) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  const notes = useNotesStore((s) => s.notes)
  const loading = useNotesStore((s) => s.loading)
  const filter = useNotesStore((s) => s.filter)
  const fetchNotes = useNotesStore((s) => s.fetchNotes)
  const setFilter = useNotesStore((s) => s.setFilter)
  const deleteNote = useNotesStore((s) => s.deleteNote)
  const togglePin = useNotesStore((s) => s.togglePin)
  const filteredNotes = useNotesStore((s) => s.filteredNotes)
  const subscribeRealtime = useNotesStore((s) => s.subscribeRealtime)

  // 加载数据和订阅实时变更
  useEffect(() => {
    fetchNotes()
    const unsubscribe = subscribeRealtime()
    return () => unsubscribe()
  }, [fetchNotes, subscribeRealtime])

  // 获取过滤后的列表
  const displayNotes = filteredNotes()

  // 删除确认
  const handleDelete = useCallback((id: string) => {
    Alert.alert('确认删除', '确定要删除这条记录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => deleteNote(id),
      },
    ])
  }, [deleteNote])

  // 长按弹出操作菜单（置顶 + 删除）
  const handleLongPress = useCallback((item: Note) => {
    const pinLabel = item.pinned ? '取消置顶' : '置顶'
    Alert.alert('操作', undefined, [
      {
        text: pinLabel,
        onPress: () => togglePin(item.id),
      },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => handleDelete(item.id),
      },
      { text: '取消', style: 'cancel' },
    ])
  }, [togglePin, handleDelete])

  // 渲染分类筛选栏
  const renderFilterBar = () => (
    <View style={[styles.filterBar, { paddingHorizontal: theme.spacing.md }]}>
      {FILTERS.map((f) => (
        <TouchableOpacity
          key={f.key}
          style={[
            styles.filterChip,
            {
              backgroundColor:
                filter === f.key ? theme.colors.primary : theme.colors.surface,
              borderRadius: theme.borderRadius.lg,
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.xs + 2,
              borderWidth: 1,
              borderColor:
                filter === f.key ? theme.colors.primary : theme.colors.border,
            },
          ]}
          onPress={() => setFilter(f.key)}
        >
          <Text
            style={{
              color: filter === f.key ? '#FFFFFF' : theme.colors.textSecondary,
              fontSize: theme.fontSize.sm,
              fontWeight: filter === f.key ? '600' : '400',
            }}
          >
            {f.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )

  // 渲染记录卡片
  const renderNote = ({ item }: { item: Note }) => (
    <Card style={{ marginHorizontal: theme.spacing.md, marginBottom: theme.spacing.sm }}>
      <TouchableOpacity
        onLongPress={() => handleLongPress(item)}
        activeOpacity={0.8}
      >
        {/* 头部：分类标签 + 置顶 */}
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.typeTag,
              {
                backgroundColor: `${TYPE_COLORS[item.type]}20`,
                borderRadius: theme.borderRadius.sm,
                paddingHorizontal: theme.spacing.sm,
                paddingVertical: 2,
              },
            ]}
          >
            <Text style={{ color: TYPE_COLORS[item.type], fontSize: theme.fontSize.xs }}>
              {TYPE_LABELS[item.type]}
            </Text>
          </View>

          <TouchableOpacity onPress={() => togglePin(item.id)}>
            <Text style={{ fontSize: 18, opacity: item.pinned ? 1 : 0.3 }}>📌</Text>
          </TouchableOpacity>
        </View>

        {/* 内容 */}
        <Text
          style={[
            styles.noteContent,
            {
              color: theme.colors.text,
              fontSize: theme.fontSize.md,
              marginTop: theme.spacing.sm,
            },
          ]}
          numberOfLines={4}
        >
          {item.content}
        </Text>

        {/* 底部：时间 + 删除 */}
        <View style={[styles.cardFooter, { marginTop: theme.spacing.sm }]}>
          <Text style={{ color: theme.colors.textSecondary, fontSize: theme.fontSize.xs }}>
            {new Date(item.created_at).toLocaleString('zh-CN', {
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
          <TouchableOpacity onPress={() => handleDelete(item.id)}>
            <Text style={{ color: theme.colors.error, fontSize: theme.fontSize.xs }}>
              删除
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Card>
  )

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
          快速记录
        </Text>
      </View>

      {/* 分类筛选栏 */}
      {renderFilterBar()}

      {/* 列表 */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : displayNotes.length === 0 ? (
        <EmptyState
          icon="📝"
          title="暂无记录"
          description="点击右下角按钮创建第一条快速记录"
        />
      ) : (
        <FlatList
          data={displayNotes}
          keyExtractor={(item) => item.id}
          renderItem={renderNote}
          contentContainerStyle={{ paddingTop: theme.spacing.sm, paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
        />
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
        onPress={() => navigation.navigate('CreateNote')}
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
  filterBar: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
  },
  filterChip: {},
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeTag: {},
  noteContent: {
    lineHeight: 22,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
