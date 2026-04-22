import React from 'react';
import { Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
}

export const Button = ({ title, onPress, loading, variant = 'primary' }: ButtonProps) => {
  const buttonStyle = variant === 'outline' ? styles.buttonOutline : styles.buttonPrimary;
  const textStyle = variant === 'outline' ? styles.textOutline : styles.textPrimary;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      style={[styles.base, buttonStyle]}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? '#007AFF' : '#FFF'} />
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
    backgroundColor: '#007AFF',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  textPrimary: {
    color: '#FFFFFF',
  },
  textOutline: {
    color: '#007AFF',
  },
});
