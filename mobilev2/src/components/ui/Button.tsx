import React from 'react';
import { Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '../../theme/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  style?: any;
}

export const Button = ({ title, onPress, loading, variant = 'primary', style }: ButtonProps) => {
  const buttonStyle = variant === 'outline' ? styles.buttonOutline : styles.buttonPrimary;
  const textStyle = variant === 'outline' ? styles.textOutline : styles.textPrimary;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      style={[styles.base, buttonStyle, style]}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? Colors.primary : Colors.white} />
      ) : (
        <Text style={[styles.text, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buttonPrimary: {
    backgroundColor: Colors.buttonBg,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  textPrimary: {
    color: Colors.white,
  },
  textOutline: {
    color: Colors.primary,
  },
});
