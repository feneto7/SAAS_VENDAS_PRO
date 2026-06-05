import React from 'react';
import { Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Shadows } from '../../theme/theme';
import { useTheme } from '../../stores/useThemeStore';

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  style?: any;
}

export const Button = ({ title, onPress, loading, variant = 'primary', style }: ButtonProps) => {
  const { colors, isDark } = useTheme();

  const buttonStyle = variant === 'outline' 
    ? { backgroundColor: 'transparent', borderColor: colors.primary, borderWidth: 1 }
    : { backgroundColor: colors.buttonBg, ...Shadows.neumorphic(isDark) };
    
  const textStyle = variant === 'outline' 
    ? { color: colors.primary } 
    : { color: colors.white };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      style={[
        {
          height: 56,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 16,
          flexDirection: 'row',
          gap: 8,
        },
        buttonStyle,
        style
      ]}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? colors.primary : colors.white} />
      ) : (
        <Text style={[{ fontSize: 16, fontWeight: '700' }, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};
