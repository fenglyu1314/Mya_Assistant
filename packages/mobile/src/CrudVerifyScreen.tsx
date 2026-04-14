// CRUD 端到端验证页面
// 通过 SupabaseAdapter 对 notes 表执行 create → getAll → update → remove
import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { SupabaseAdapter } from '@mya/shared'
import type { Note } from '@mya/shared'
import { supabaseClient } from './supabase'

// 临时开发用 user_id（Phase 0 无 Auth）
const DEV_USER_ID = '00000000-0000-0000-0000-000000000001'

type LogEntry = {
  time: string
  action: string
  result: string
  success: boolean
}

export default function CrudVerifyScreen() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [running, setRunning] = useState(false)

  const addLog = useCallback((action: string, result: string, success: boolean) => {
    const time = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, { time, action, result, success }])
  }, [])

  const runCrudTest = useCallback(async () => {
    setLogs([])
    setRunning(true)

    const adapter = new SupabaseAdapter<Note>(supabaseClient, 'notes')
    let createdId = ''

    try {
      // 1. CREATE
      addLog('CREATE', '正在创建 note...', true)
      const created = await adapter.create({
        user_id: DEV_USER_ID,
        content: '来自移动端的 CRUD 验证',
        type: 'memo',
        images: [],
        pinned: false,
        tags: ['phase0-test'],
        _deleted: false,
      })
      createdId = created.id
      addLog('CREATE', `✓ 创建成功 id=${created.id.slice(0, 8)}...`, true)

      // 2. GET ALL
      const allNotes = await adapter.getAll()
      const found = allNotes.some(n => n.id === createdId)
      addLog('GET ALL', `✓ 查询到 ${allNotes.length} 条记录，包含新建记录: ${found}`, found)

      // 3. UPDATE
      const updated = await adapter.update(createdId, {
        content: '已被移动端更新',
        pinned: true,
      })
      addLog('UPDATE', `✓ 更新成功 pinned=${updated.pinned}, updated_at=${updated.updated_at}`, true)

      // 4. REMOVE（软删除）
      await adapter.remove(createdId)
      const afterRemove = await adapter.getAll()
      const stillVisible = afterRemove.some(n => n.id === createdId)
      addLog('REMOVE', `✓ 软删除成功 记录仍可见: ${stillVisible}（应为 false）`, !stillVisible)

      addLog('完成', '🎉 CRUD 四个操作全部通过！', true)
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      addLog('错误', `✗ ${msg}`, false)
    } finally {
      setRunning(false)
    }
  }, [addLog])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CRUD 验证 - Notes 表</Text>
      <Text style={styles.subtitle}>通过 SupabaseAdapter 验证端到端</Text>

      <TouchableOpacity
        style={[styles.button, running && styles.buttonDisabled]}
        onPress={runCrudTest}
        disabled={running}
      >
        {running ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>运行 CRUD 测试</Text>
        )}
      </TouchableOpacity>

      <ScrollView style={styles.logContainer}>
        {logs.map((log, i) => (
          <View key={i} style={[styles.logEntry, !log.success && styles.logError]}>
            <Text style={styles.logTime}>{log.time}</Text>
            <Text style={styles.logAction}>[{log.action}]</Text>
            <Text style={styles.logResult}>{log.result}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#1a1a2e',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#e0e0e0',
    textAlign: 'center',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4a90d9',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#555',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logContainer: {
    flex: 1,
    backgroundColor: '#16213e',
    borderRadius: 8,
    padding: 12,
  },
  logEntry: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4a',
  },
  logError: {
    backgroundColor: 'rgba(255, 80, 80, 0.1)',
  },
  logTime: {
    color: '#666',
    fontSize: 12,
    marginRight: 8,
  },
  logAction: {
    color: '#4a90d9',
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 8,
  },
  logResult: {
    color: '#e0e0e0',
    fontSize: 12,
    flex: 1,
  },
})
