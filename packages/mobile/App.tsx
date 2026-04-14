// Mya Assistant 移动端 — Phase 0 验证入口
// 提供 CRUD 验证和 Realtime 验证两个页面切换
import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native'
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context'
import CrudVerifyScreen from './src/CrudVerifyScreen'
import RealtimeVerifyScreen from './src/RealtimeVerifyScreen'

type Tab = 'crud' | 'realtime'

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('crud')
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'crud' && styles.tabActive]}
          onPress={() => setActiveTab('crud')}
        >
          <Text style={[styles.tabText, activeTab === 'crud' && styles.tabTextActive]}>
            CRUD 验证
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'realtime' && styles.tabActive]}
          onPress={() => setActiveTab('realtime')}
        >
          <Text style={[styles.tabText, activeTab === 'realtime' && styles.tabTextActive]}>
            Realtime 验证
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'crud' ? <CrudVerifyScreen /> : <RealtimeVerifyScreen />}
    </View>
  )
}

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <AppContent />
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#16213e',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4a',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#4a90d9',
  },
  tabText: {
    color: '#888',
    fontSize: 15,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#4a90d9',
  },
})

export default App
