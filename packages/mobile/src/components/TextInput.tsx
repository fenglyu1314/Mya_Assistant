import React from 'react'
import {
  View,
  Text,
  TextInput as RNTextInput,
  StyleSheet,
  ViewStyle,
} from 'react-native'
import type { TextInputProps as RNTextInputProps } from 'react-native'
import { useTheme } from '../theme'

export interface TextInputProps extends Omit<RNTextInputProps, 'style'> {
  label?: string
  error?: string
  containerStyle?: ViewStyle
}

export function TextInput({
  label,
  error,
  containerStyle,
  ...props
}: TextInputProps) {
  const theme = useTheme()

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text
          style={[
            styles.label,
            {
              color: theme.colors.textSecondary,
              fontSize: theme.fontSize.sm,
              marginBottom: theme.spacing.xs,
            },
          ]}
        >
          {label}
        </Text>
      )}
      <RNTextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.surface,
            color: theme.colors.text,
            borderColor: error ? theme.colors.error : theme.colors.border,
            borderRadius: theme.borderRadius.md,
            fontSize: theme.fontSize.md,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.sm + 4,
          },
        ]}
        placeholderTextColor={theme.colors.textSecondary}
        {...props}
      />
      {error && (
        <Text
          style={[
            styles.error,
            {
              color: theme.colors.error,
              fontSize: theme.fontSize.xs,
              marginTop: theme.spacing.xs,
            },
          ]}
        >
          {error}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
  },
  error: {},
})
