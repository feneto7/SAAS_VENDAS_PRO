import React, { useState } from 'react';
import { 
  Modal, View, Text, StyleSheet, ScrollView, 
  TouchableOpacity, KeyboardAvoidingView, Platform, 
  Alert, ActivityIndicator 
} from 'react-native';
import { X, User, MapPin, Phone, MessageSquare, Tag, Info } from 'lucide-react-native';
import { Colors, Shadows } from '../../../theme/theme';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { db } from '../../../services/database';
import { SyncService } from '../../../services/syncService';
import { useAuthStore } from '../../../stores/useAuthStore';
import * as Crypto from 'expo-crypto';

interface AddCustomerModalProps {
  visible: boolean;
  onClose: () => void;
  routeId: string;
  onSuccess: () => void;
}

export const AddCustomerModal = ({ visible, onClose, routeId, onSuccess }: AddCustomerModalProps) => {
  const [loading, setLoading] = useState(false);
  const user = useAuthStore((state) => state.user);

  // Form State
  const [form, setForm] = useState({
    name: '',
    nickname: '',
    street: '',
    state: '',
    city: '',
    neighborhood: '',
    referencePoint: '',
    phone: '',
    phone2: '',
    comment: ''
  });

  const [errors, setErrors] = useState<any>({});

  const validate = () => {
    const newErrors: any = {};
    if (!form.name.trim()) newErrors.name = 'Nome é obrigatório';
    if (!form.street.trim()) newErrors.street = 'Logradouro é obrigatório';
    if (!form.city.trim()) newErrors.city = 'Cidade é obrigatória';
    if (!form.state.trim()) newErrors.state = 'UF é obrigatório';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (!user?.id) {
      Alert.alert('Erro', 'Usuário não autenticado');
      return;
    }

    setLoading(true);
    try {
      const clientId = Crypto.randomUUID();
      
      const clientData = {
        id: clientId,
        name: form.name.trim(),
        nickname: form.nickname.trim(),
        street: form.street.trim(),
        state: form.state.trim().toUpperCase(),
        city: form.city.trim(),
        neighborhood: form.neighborhood.trim(),
        reference_point: form.referencePoint.trim(),
        phone: form.phone.trim(),
        phone2: form.phone2.trim(),
        comment: form.comment.trim(),
        route_id: routeId,
        active: 1
      };

      // 1. Gravar Local
      await db.runAsync(
        `INSERT INTO clients (
          id, name, nickname, street, state, city, 
          neighborhood, reference_point, phone, phone2, 
          comment, route_id, active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          clientData.id, clientData.name, clientData.nickname, clientData.street, 
          clientData.state, clientData.city, clientData.neighborhood, 
          clientData.reference_point, clientData.phone, clientData.phone2, 
          clientData.comment, clientData.route_id, clientData.active
        ]
      );

      // 2. Enfileirar para Sincronismo
      await SyncService.enqueue('POST_CLIENT', 'clients', clientData);

      Alert.alert('Sucesso', 'Cliente cadastrado com sucesso!');
      onSuccess();
      handleClose();
    } catch (err) {
      console.error('Error saving client:', err);
      Alert.alert('Erro', 'Falha ao salvar cliente localmente.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm({
      name: '', nickname: '', street: '', state: '',
      city: '', neighborhood: '', referencePoint: '',
      phone: '', phone2: '', comment: ''
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Novo Cliente</Text>
                <Text style={styles.subtitle}>Preencha os dados abaixo</Text>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                <X color={Colors.white} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.form} 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.formContent}
            >
              {/* SEÇÃO 1: IDENTIFICAÇÃO */}
              <View style={styles.sectionHeader}>
                <User size={16} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Identificação</Text>
              </View>

              <Input 
                label="Nome Completo *" 
                icon={User}
                value={form.name}
                onChangeText={(t: string) => setForm(f => ({...f, name: t}))}
                error={errors.name}
                placeholder="Ex: João da Silva"
              />
              <Input 
                label="Apelido" 
                icon={Tag}
                value={form.nickname}
                onChangeText={(t: string) => setForm(f => ({...f, nickname: t}))}
                placeholder="Ex: Tio João"
              />

              {/* SEÇÃO 2: CONTATO */}
              <View style={styles.sectionHeader}>
                <Phone size={16} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Contato</Text>
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Input 
                    label="Contato 1" 
                    icon={Phone}
                    value={form.phone}
                    onChangeText={(t: string) => setForm(f => ({...f, phone: t}))}
                    placeholder="(00) 00000"
                    keyboardType="phone-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input 
                    label="Contato 2" 
                    icon={Phone}
                    value={form.phone2}
                    onChangeText={(t: string) => setForm(f => ({...f, phone2: t}))}
                    placeholder="(00) 00000"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* SEÇÃO 3: ENDEREÇO */}
              <View style={styles.sectionHeader}>
                <MapPin size={16} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Localização</Text>
              </View>

              <Input 
                label="Logradouro (Rua/Av) *" 
                icon={MapPin}
                value={form.street}
                onChangeText={(t: string) => setForm(f => ({...f, street: t}))}
                error={errors.street}
                placeholder="Rua, Avenida, Travessa..."
              />

              <View style={styles.row}>
                <View style={{ flex: 2, marginRight: 12 }}>
                  <Input 
                    label="Cidade *" 
                    value={form.city}
                    onChangeText={(t: string) => setForm(f => ({...f, city: t}))}
                    error={errors.city}
                    placeholder="Cidade"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input 
                    label="UF *" 
                    value={form.state}
                    onChangeText={(t: string) => setForm(f => ({...f, state: t}))}
                    error={errors.state}
                    placeholder="EX: SP"
                    maxLength={2}
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Input 
                    label="Bairro" 
                    value={form.neighborhood}
                    onChangeText={(t: string) => setForm(f => ({...f, neighborhood: t}))}
                    placeholder="Bairro"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input 
                    label="Ponto Ref." 
                    value={form.referencePoint}
                    onChangeText={(t: string) => setForm(f => ({...f, referencePoint: t}))}
                    placeholder="Próximo a..."
                  />
                </View>
              </View>

              {/* SEÇÃO 4: OBSERVAÇÕES */}
              <View style={styles.sectionHeader}>
                <MessageSquare size={16} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Complemento</Text>
              </View>

              <Input 
                label="Observações" 
                icon={Info}
                value={form.comment}
                onChangeText={(t: string) => setForm(f => ({...f, comment: t}))}
                placeholder="Informações adicionais..."
                multiline
                numberOfLines={3}
              />
              
              <View style={{ height: 40 }} />
            </ScrollView>
          </KeyboardAvoidingView>

          <View style={styles.footer}>
            <Button 
              title="CANCELAR" 
              variant="outline" 
              onPress={handleClose}
              style={{ flex: 1, marginRight: 12 }}
            />
            <Button 
              title="SALVAR CLIENTE" 
              onPress={handleSave}
              loading={loading}
              style={{ flex: 2 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '92%',
    ...Shadows.black,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    flex: 1,
  },
  formContent: {
    padding: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    paddingLeft: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  footer: {
    padding: 24,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    backgroundColor: Colors.cardBg,
  }
});
