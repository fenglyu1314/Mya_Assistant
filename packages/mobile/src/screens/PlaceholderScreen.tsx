import React from 'react'
import { View, StyleSheet } from 'react-native'
import { useTheme } from '../theme'
import { EmptyState } from '../components/EmptyState'

interface PlaceholderParams {
  title?: string
  description?: string
}

export function PlaceholderScreen({ route }: { route?: { params?: PlaceholderParams } }) {
  const theme = useTheme()
  const title = route?.params?.title ?? '即将推出'
  const description = route?.params?.description ?? '该功能正在开发中'

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <EmptyState
        icon="🚧"
        title={title}
        description={description}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
