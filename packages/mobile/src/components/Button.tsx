import React from 'react'
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native'
import { useTheme } from '../theme'

export interface ButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  loading?: boolean
  disabled?: boolean
  style?: ViewStyle
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const theme = useTheme()
  const isDisabled = disabled || loading

  const containerStyles: ViewStyle[] = [
    styles.base,
    {
      borderRadius: theme.borderRadius.md,
      paddingVertical: theme.spacing.sm + 4,
      paddingHorizontal: theme.spacing.lg,
    },
  ]

  const textStyles: TextStyle[] = [
    styles.text,
    { fontSize: theme.fontSize.md },
  ]

  // 根据 variant 设置不同样式
  switch (variant) {
    case 'primary':
      containerStyles.push({
        backgroundColor: isDisabled ? `${theme.colors.primary}80` : theme.colors.primary,
      })
      textStyles.push({ color: '#FFFFFF' })
      break
    case 'secondary':
      containerStyles.push({
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: isDisabled ? `${theme.colors.primary}80` : theme.colors.primary,
      })
      textStyles.push({
        color: isDisabled ? `${theme.colors.primary}80` : theme.colors.primary,
      })
      break
    case 'ghost':
      containerStyles.push({ backgroundColor: 'transparent' })
      textStyles.push({
        color: isDisabled ? theme.colors.textSecondary : theme.colors.primary,
      })
      break
  }

  if (style) {
    containerStyles.push(style)
  }

  return (
    <TouchableOpacity
      style={containerStyles}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? '#FFFFFF' : theme.colors.primary}
          size="small"
        />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    fontWeight: '600',
  },
})
