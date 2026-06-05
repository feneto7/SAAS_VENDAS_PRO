import React from 'react';
import { View, Text } from 'react-native';
import { User } from 'lucide-react-native';
import { useTheme } from '../../../stores/useThemeStore';
import { getStyles } from '../CardDetailScreen.styles';
import { formatCentsToBRL } from '../../../utils/money';

interface ClientInfoBarProps {
  clientName?: string;
  total?: number;
}

export const ClientInfoBar = ({ clientName, total }: ClientInfoBarProps) => {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  return (
    <View style={styles.clientBar}>
      <View style={styles.clientIcon}>
        <User size={20} color={colors.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.clientLabel}>Cliente</Text>
        <Text style={styles.clientValue} numberOfLines={1}>{clientName || '---'}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.clientLabel}>Total Parcial</Text>
        <Text style={styles.clientTotal}>{formatCentsToBRL(total || 0)}</Text>
      </View>
    </View>
  );
};
