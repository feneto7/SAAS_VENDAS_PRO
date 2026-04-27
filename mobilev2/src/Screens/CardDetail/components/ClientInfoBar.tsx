import React from 'react';
import { View, Text } from 'react-native';
import { Package } from 'lucide-react-native';
import { Colors } from '../../../theme/theme';
import { formatCentsToBRL } from '../../../utils/money';
import { styles } from '../CardDetailScreen.styles';

interface ClientInfoBarProps {
  clientName: string | undefined;
  total: number;
}

export const ClientInfoBar = ({ clientName, total }: ClientInfoBarProps) => (
  <View style={styles.clientBar}>
    <View style={styles.clientIcon}>
      <Package color={Colors.primary} size={20} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.clientLabel}>Cliente</Text>
      <Text style={styles.clientValue} numberOfLines={1}>{clientName || '---'}</Text>
    </View>
    <View style={{ alignItems: 'flex-end' }}>
      <Text style={styles.clientLabel}>Total</Text>
      <Text style={styles.clientTotal}>{formatCentsToBRL(total)}</Text>
    </View>
  </View>
);
