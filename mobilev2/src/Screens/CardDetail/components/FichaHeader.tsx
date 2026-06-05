import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../../../stores/useThemeStore';
import { formatStatus } from '../../../utils/status';
import { getStyles } from '../CardDetailScreen.styles';

interface FichaHeaderProps {
  code: string | undefined;
  status: string | undefined;
  onBack: () => void;
}

export const FichaHeader = ({ code, status, onBack }: FichaHeaderProps) => {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
        <ChevronLeft color={colors.textPrimary} size={24} />
      </TouchableOpacity>
      <View style={styles.headerTitleBox}>
        <Text style={styles.title}>Ficha #{code || '---'}</Text>
        <View style={[styles.statusBadge, { backgroundColor: status === 'nova' ? colors.info : colors.surfaceRaised }]}>
          <Text style={styles.statusText}>{formatStatus(status || '')}</Text>
        </View>
      </View>
      <View style={{ width: 44 }} />
    </View>
  );
};
