import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { useTheme } from '../../stores/useThemeStore';
import { LucideIcon } from 'lucide-react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: LucideIcon;
}

export const Input = ({ label, error, icon: Icon, ...props }: InputProps) => {
  const { colors } = useTheme();

  return (
    <View style={{ marginBottom: 20 }}>
      {label && (
        <Text style={{
          fontSize: 13,
          fontWeight: '700',
          color: colors.textSecondary,
          marginBottom: 10,
          marginLeft: 4,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}>
          {label}
        </Text>
      )}
      <View style={[
        {
          height: 56,
          borderRadius: 16,
          borderWidth: 1.5,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.inputBg,
          borderColor: error ? colors.danger : colors.inputBorder,
        },
        props.multiline && { height: 'auto', minHeight: 80, alignItems: 'flex-start', paddingTop: 12 }
      ]}>
        {Icon && (
          <View style={{ width: 24, alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={20} color={error ? colors.danger : colors.accent} />
          </View>
        )}
        <TextInput
          placeholderTextColor={colors.textMuted}
          style={[
            {
              flex: 1,
              fontSize: 16,
              color: colors.textInput,
              padding: 0,
              fontWeight: '500',
            },
            Icon && { marginLeft: 10 }
          ]}
          selectionColor={colors.accent}
          {...props}
        />
      </View>
      {error && (
        <Text style={{
          fontSize: 12,
          color: colors.danger,
          marginTop: 6,
          marginLeft: 4,
          fontWeight: '600',
        }}>
          {error}
        </Text>
      )}
    </View>
  );
};
