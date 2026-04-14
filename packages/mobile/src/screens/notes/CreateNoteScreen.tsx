import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput as RNTextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNotesStore } from '@mya/shared'
import type { NoteType } from '@mya/shared'
import { useTheme } from '../../theme'
import { Button } from '../../components/Button'

// 分类选项
const NOTE_TYPES: { key: NoteType; label: string }[] = [
  { key: 'memo', label: '备忘' },
  { key: 'idea', label: '灵感' },
  { key: 'log', label: '日志' },
]

export function CreateNoteScreen({ navigation }: { navigation: any }) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const createNote = useNotesStore((s) => s.createNote)

  const [content, setContent] = useState('')
  const [type, setType] = useState<NoteType>('memo')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    setError('')

    if (!content.trim()) {
      setError('内容不能为空')
      return
    }

    setLoading(true)
    try {
      await createNote(content.trim(), type)
      navigation.goBack()
    } catch {
      setError('创建失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* 顶部导航栏 */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + theme.spacing.sm,
            paddingHorizontal: theme.spacing.md,
            paddingBottom: theme.spacing.sm,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: theme.colors.primary, fontSize: theme.fontSize.md }}>
            取消
          </Text>
        </TouchableOpacity>
        <Text
          style={{
            color: theme.colors.text,
            fontSize: theme.fontSize.lg,
            fontWeight: '600',
          }}
        >
          新建记录
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.body, { padding: theme.spacing.md }]}>
        {/* 分类选择 */}
        <View style={[styles.typeSelector, { marginBottom: theme.spacing.md }]}>
          {NOTE_TYPES.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[
                styles.typeChip,
                {
                  backgroundColor:
                    type === t.key ? theme.colors.primary : theme.colors.surface,
                  borderRadius: theme.borderRadius.md,
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.sm,
                  borderWidth: 1,
                  borderColor:
                    type === t.key ? theme.colors.primary : theme.colors.border,
                },
              ]}
              onPress={() => setType(t.key)}
            >
              <Text
                style={{
                  color: type === t.key ? '#FFFFFF' : theme.colors.textSecondary,
                  fontSize: theme.fontSize.sm,
                  fontWeight: type === t.key ? '600' : '400',
                }}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 内容输入 */}
        <RNTextInput
          style={[
            styles.textArea,
            {
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              borderColor: error ? theme.colors.error : theme.colors.border,
              borderRadius: theme.borderRadius.md,
              fontSize: theme.fontSize.md,
              padding: theme.spacing.md,
            },
          ]}
          placeholder="写下你的想法..."
          placeholderTextColor={theme.colors.textSecondary}
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
          autoFocus
        />

        {error ? (
          <Text
            style={{
              color: theme.colors.error,
              fontSize: theme.fontSize.xs,
              marginTop: theme.spacing.xs,
            }}
          >
            {error}
          </Text>
        ) : null}

        <Button
          title="创建"
          onPress={handleCreate}
          loading={loading}
          style={{ marginTop: theme.spacing.lg }}
        />
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  body: {
    flex: 1,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeChip: {},
  textArea: {
    flex: 1,
    borderWidth: 1,
    maxHeight: 300,
    minHeight: 150,
  },
})
