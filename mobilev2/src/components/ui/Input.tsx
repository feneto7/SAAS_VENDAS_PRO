import React from 'react';
import { View, Text, TextInput, TextInputProps, StyleSheet } from 'react-native';
import { Colors } from '../../theme/theme';
import { LucideIcon } from 'lucide-react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: LucideIcon;
}

export const Input = ({ label, error, icon: Icon, ...props }: InputProps) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        styles.inputWrapper, 
        error ? styles.inputError : styles.inputNormal,
        props.multiline && { height: 'auto', minHeight: 80, alignItems: 'flex-start', paddingTop: 12 }
      ]}>
        {Icon && (
          <View style={styles.iconBox}>
            <Icon size={20} color={error ? Colors.danger : Colors.primary} />
          </View>
        )}
        <TextInput
          placeholderTextColor={Colors.textMuted}
          style={[styles.input, Icon && { marginLeft: 10 }]}
          selectionColor={Colors.primary}
          {...props}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 10,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
  },
  iconBox: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputNormal: {
    borderColor: Colors.cardBorder,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.white,
    padding: 0,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '600',
  },
});
