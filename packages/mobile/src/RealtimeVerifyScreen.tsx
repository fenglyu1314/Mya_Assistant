// Realtime 订阅验证页面
// 订阅 notes 表变更，同时提供手动插入按钮验证回调是否被触发
import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { SupabaseAdapter } from '@mya/shared'
import type { Note, RealtimePayload } from '@mya/shared'
import { supabaseClient } from './supabase'

// 临时开发用 user_id（Phase 0 无 Auth）
const DEV_USER_ID = '00000000-0000-0000-0000-000000000001'

type EventLog = {
  time: string
  eventType: string
  detail: string
}

export default function RealtimeVerifyScreen() {
  const [events, setEvents] = useState<EventLog[]>([])
  const [subscribed, setSubscribed] = useState(false)
  const [inserting, setInserting] = useState(false)
  const unsubRef = useRef<(() => void) | null>(null)
  const adapterRef = useRef<SupabaseAdapter<Note> | null>(null)

  // 初始化 adapter
  useEffect(() => {
    adapterRef.current = new SupabaseAdapter<Note>(supabaseClient, 'notes')
  }, [])

  // 订阅 Realtime 变更
  const toggleSubscribe = useCallback(() => {
    if (subscribed && unsubRef.current) {
      unsubRef.current()
      unsubRef.current = null
      setSubscribed(false)
      setEvents(prev => [
        ...prev,
        { time: new Date().toLocaleTimeString(), eventType: 'INFO', detail: '已取消订阅' },
      ])
      return
    }

    if (!adapterRef.current) return

    const unsub = adapterRef.current.subscribe(
      (payload: RealtimePayload<Note>) => {
        const time = new Date().toLocaleTimeString()
        const noteContent = payload.new?.content ?? payload.old?.id?.slice(0, 8) ?? '未知'
        setEvents(prev => [
          ...prev,
          {
            time,
            eventType: payload.eventType,
            detail: `${payload.eventType}: "${noteContent}"`,
          },
        ])
      },
      (status: string, err?: Error) => {
        // 显示频道连接状态
        const time = new Date().toLocaleTimeString()
        const detail = err
          ? `频道状态: ${status}，错误: ${err.message}`
          : `频道状态: ${status}`
        setEvents(prev => [
          ...prev,
          {
            time,
            eventType: status === 'SUBSCRIBED' ? 'INFO' : 'ERROR',
            detail,
          },
        ])
      }
    )

    unsubRef.current = unsub
    setSubscribed(true)
    setEvents(prev => [
      ...prev,
      { time: new Date().toLocaleTimeString(), eventType: 'INFO', detail: '已开始订阅 notes 表变更...' },
    ])
  }, [subscribed])

  // 手动插入一条记录触发 Realtime 回调
  const insertNote = useCallback(async () => {
    if (!adapterRef.current) return
    setInserting(true)
    try {
      const note = await adapterRef.current.create({
        user_id: DEV_USER_ID,
        content: `Realtime 测试 ${new Date().toLocaleTimeString()}`,
        type: 'memo',
        images: [],
        pinned: false,
        tags: ['realtime-test'],
        _deleted: false,
      })
      setEvents(prev => [
        ...prev,
        {
          time: new Date().toLocaleTimeString(),
          eventType: 'MANUAL',
          detail: `手动插入: id=${note.id.slice(0, 8)}...`,
        },
      ])
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      setEvents(prev => [
        ...prev,
        { time: new Date().toLocaleTimeString(), eventType: 'ERROR', detail: msg },
      ])
    } finally {
      setInserting(false)
    }
  }, [])

  // 清理订阅
  useEffect(() => {
    return () => {
      if (unsubRef.current) {
        unsubRef.current()
      }
    }
  }, [])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Realtime 验证 - Notes 表</Text>
      <Text style={styles.subtitle}>订阅后，在 Supabase Dashboard 或此处插入数据</Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, subscribed && styles.buttonActive]}
          onPress={toggleSubscribe}
        >
          <Text style={styles.buttonText}>
            {subscribed ? '取消订阅' : '开始订阅'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary, inserting && styles.buttonDisabled]}
          onPress={insertNote}
          disabled={inserting}
        >
          {inserting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>插入测试数据</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.eventContainer}>
        {events.length === 0 && (
          <Text style={styles.placeholder}>等待事件...</Text>
        )}
        {events.map((evt, i) => (
          <View key={i} style={styles.eventEntry}>
            <Text style={styles.eventTime}>{evt.time}</Text>
            <Text style={[
              styles.eventType,
              evt.eventType === 'INSERT' && styles.eventInsert,
              evt.eventType === 'UPDATE' && styles.eventUpdate,
              evt.eventType === 'DELETE' && styles.eventDelete,
              evt.eventType === 'ERROR' && styles.eventError,
            ]}>
              [{evt.eventType}]
            </Text>
            <Text style={styles.eventDetail}>{evt.detail}</Text>
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
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    backgroundColor: '#4a90d9',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonActive: {
    backgroundColor: '#d94a4a',
  },
  buttonSecondary: {
    backgroundColor: '#3a7a3a',
  },
  buttonDisabled: {
    backgroundColor: '#555',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  eventContainer: {
    flex: 1,
    backgroundColor: '#16213e',
    borderRadius: 8,
    padding: 12,
  },
  placeholder: {
    color: '#555',
    textAlign: 'center',
    marginTop: 20,
  },
  eventEntry: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4a',
  },
  eventTime: {
    color: '#666',
    fontSize: 12,
    marginRight: 8,
  },
  eventType: {
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 8,
    color: '#888',
  },
  eventInsert: {
    color: '#4adf4a',
  },
  eventUpdate: {
    color: '#dfdf4a',
  },
  eventDelete: {
    color: '#df4a4a',
  },
  eventError: {
    color: '#ff5555',
  },
  eventDetail: {
    color: '#e0e0e0',
    fontSize: 12,
    flex: 1,
  },
})
