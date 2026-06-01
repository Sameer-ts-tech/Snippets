import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, StyleProp, TextStyle } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import { spacing, fontSizes, shadows } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: string;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const { colors } = useAppTheme();

  // Determine styles based on variant
  const getVariantStyles = (): { btn: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'secondary':
        return {
          btn: {
            backgroundColor: colors.secondary,
            borderColor: colors.secondary,
          },
          text: { color: '#FFFFFF' },
        };
      case 'outline':
        return {
          btn: {
            backgroundColor: 'transparent',
            borderColor: colors.border,
            borderWidth: 1,
          },
          text: { color: colors.text },
        };
      case 'danger':
        return {
          btn: {
            backgroundColor: colors.danger,
            borderColor: colors.danger,
          },
          text: { color: '#FFFFFF' },
        };
      case 'ghost':
        return {
          btn: {
            backgroundColor: 'transparent',
            borderColor: 'transparent',
          },
          text: { color: colors.textMuted },
        };
      case 'primary':
      default:
        return {
          btn: {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
            ...shadows.sm,
          },
          text: { color: '#FFFFFF' },
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled || loading}
      style={[
        styles.button,
        variantStyles.btn,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantStyles.text.color} />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons
              name={icon as any}
              size={18}
              color={variantStyles.text.color}
              style={styles.leftIcon}
            />
          )}
          
          <Text style={[styles.text, variantStyles.text, textStyle]}>{title}</Text>
          
          {icon && iconPosition === 'right' && (
            <Ionicons
              name={icon as any}
              size={18}
              color={variantStyles.text.color}
              style={styles.rightIcon}
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 48,
  },
  text: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  rightIcon: {
    marginLeft: spacing.sm,
  },
});
