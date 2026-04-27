import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { Colors } from '../../../theme/theme';
import { formatStatus } from '../../../utils/status';
import { styles } from '../CardDetailScreen.styles';

interface FichaHeaderProps {
  code: string | undefined;
  status: string | undefined;
  onBack: () => void;
}

export const FichaHeader = ({ code, status, onBack }: FichaHeaderProps) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
      <ChevronLeft color={Colors.white} size={24} />
    </TouchableOpacity>
    <View style={styles.headerTitleBox}>
      <Text style={styles.title}>Ficha #{code || '---'}</Text>
      <View style={[styles.statusBadge, { backgroundColor: status === 'nova' ? Colors.info : Colors.cardBg }]}>
        <Text style={styles.statusText}>{formatStatus(status || '')}</Text>
      </View>
    </View>
    <View style={{ width: 44 }} />
  </View>
);
