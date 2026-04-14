import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '../theme'

export interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  const theme = useTheme()

  return (
    <View style={styles.container}>
      {icon && (
        <Text
          style={[
            styles.icon,
            { fontSize: 48, marginBottom: theme.spacing.md },
          ]}
        >
          {icon}
        </Text>
      )}
      <Text
        style={[
          styles.title,
          {
            color: theme.colors.text,
            fontSize: theme.fontSize.lg,
            marginBottom: theme.spacing.sm,
          },
        ]}
      >
        {title}
      </Text>
      {description && (
        <Text
          style={[
            styles.description,
            {
              color: theme.colors.textSecondary,
              fontSize: theme.fontSize.sm,
            },
          ]}
        >
          {description}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  icon: {},
  title: {
    fontWeight: '600',
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    lineHeight: 20,
  },
})
