import React, { useState } from 'react';
import { 
  View as DefaultView, 
  Text as DefaultText, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { 
  X, 
  User, 
  MapPin, 
  Phone, 
  CreditCard, 
  Home, 
  Save,
} from 'lucide-react-native';
import { useTenant } from '../../lib/TenantContext';
import { useThemeColor } from '../Themed';

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const InputField = ({ label, icon: Icon, value, onChangeText, placeholder, keyboardType = 'default', maxLength }: any) => {
  const textColor = useThemeColor({}, 'text');
  const placeholderColor = useThemeColor({}, 'placeholder');
  const iconColor = useThemeColor({}, 'icon');
  const borderColor = useThemeColor({}, 'border');
  const surfaceColor = useThemeColor({}, 'surface');

  return (
    <DefaultView style={styles.inputContainer}>
      <DefaultText style={[styles.inputLabel, { color: placeholderColor }]}>{label}</DefaultText>
      <DefaultView style={[styles.inputWrapper, { backgroundColor: surfaceColor, borderColor }]}>
        <Icon size={18} color={iconColor} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { color: textColor }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={placeholderColor}
          keyboardType={keyboardType}
          maxLength={maxLength}
        />
      </DefaultView>
    </DefaultView>
  );
};

import { execute } from '../../lib/db';
import { SyncService } from '../../lib/sync/syncService';

export function NewClientModal({ isOpen, onClose, onSuccess }: NewClientModalProps) {
  const { tenantSlug, activeTrip, seller } = useTenant();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    phone: '',
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
  });

  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'primary');
  const borderColor = useThemeColor({}, 'border');
  const iconColor = useThemeColor({}, 'icon');
  const placeholderColor = useThemeColor({}, 'placeholder');

  const handleSubmit = async () => {
    if (!formData.name || !formData.street || !formData.city || !formData.state) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios (Nome, Rua, Cidade e Estado).');
      return;
    }

    if (!activeTrip?.routeId) {
      Alert.alert('Erro', 'Rota não identificada. Por favor, reinicie a viagem.');
      return;
    }

    setLoading(true);
    try {
      const clientId = SyncService.generateUUID();
      const now = new Date().toISOString();

      const payload = {
        ...formData,
        id: clientId,
        routeId: activeTrip.routeId,
        sellerId: seller?.id
      };

      // 1. Save Locally
      await execute(
        `INSERT INTO clients (id, name, cpf, phone, street, number, neighborhood, city, state, zip_code, route_id, active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
        [clientId, formData.name, formData.cpf, formData.phone, formData.street, formData.number, formData.neighborhood, formData.city, formData.state, formData.zipCode, activeTrip.routeId, now]
      );

      // 2. Enqueue Sync
      await SyncService.enqueue('CREATE_CLIENT', '/api/clients', 'POST', payload);

      Alert.alert('Sucesso', 'Cliente salvo localmente! Sincronizando...');
      onSuccess();
      onClose();
      setFormData({
        name: '',
        cpf: '',
        phone: '',
        street: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
        zipCode: '',
      });
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Falha ao salvar cliente localmente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <DefaultView style={[styles.modalContent, { backgroundColor: backgroundColor, borderColor }]}>
          <DefaultView style={[styles.dragIndicator, { backgroundColor: borderColor }]} />
          
          <DefaultView style={[styles.header, { borderBottomColor: borderColor }]}>
            <DefaultView style={styles.headerTitleContainer}>
              <DefaultView style={[styles.headerIconContainer, { backgroundColor: primaryColor + '15', borderColor: primaryColor + '30' }]}>
                <User size={20} color={primaryColor} />
              </DefaultView>
              <DefaultView>
                <DefaultText style={[styles.headerTitle, { color: textColor }]}>Novo Cliente</DefaultText>
                <DefaultText style={[styles.headerSubtitle, { color: primaryColor }]}>VINCULADO À ROTA ATUAL</DefaultText>
              </DefaultView>
            </DefaultView>
            <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: borderColor }]}>
              <X size={24} color={iconColor} />
            </TouchableOpacity>
          </DefaultView>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            <DefaultView style={styles.section}>
              <DefaultText style={[styles.sectionTitle, { color: placeholderColor }]}>Identificação</DefaultText>
              <InputField 
                label="Nome Completo *" 
                icon={User} 
                value={formData.name} 
                onChangeText={(text: string) => setFormData({...formData, name: text})} 
                placeholder="Ex: João da Silva" 
              />
              <DefaultView style={styles.row}>
                <DefaultView style={{ flex: 1, marginRight: 8 }}>
                  <InputField 
                    label="CPF / CNPJ" 
                    icon={CreditCard} 
                    value={formData.cpf} 
                    onChangeText={(text: string) => setFormData({...formData, cpf: text})} 
                    placeholder="000.000.000-00" 
                    keyboardType="numeric"
                  />
                </DefaultView>
                <DefaultView style={{ flex: 1 }}>
                  <InputField 
                    label="Telefone" 
                    icon={Phone} 
                    value={formData.phone} 
                    onChangeText={(text: string) => setFormData({...formData, phone: text})} 
                    placeholder="(00) 00000-0000" 
                    keyboardType="phone-pad"
                  />
                </DefaultView>
              </DefaultView>
            </DefaultView>

            <DefaultView style={styles.section}>
              <DefaultText style={[styles.sectionTitle, { color: placeholderColor }]}>Endereço</DefaultText>
              <DefaultView style={styles.row}>
                <DefaultView style={{ flex: 3, marginRight: 8 }}>
                  <InputField 
                    label="Rua / Logradouro *" 
                    icon={Home} 
                    value={formData.street} 
                    onChangeText={(text: string) => setFormData({...formData, street: text})} 
                    placeholder="Rua..." 
                  />
                </DefaultView>
                <DefaultView style={{ flex: 1 }}>
                  <InputField 
                    label="Nº" 
                    icon={MapPin} 
                    value={formData.number} 
                    onChangeText={(text: string) => setFormData({...formData, number: text})} 
                    placeholder="123" 
                    keyboardType="numeric"
                  />
                </DefaultView>
              </DefaultView>
              <InputField 
                label="Bairro" 
                icon={MapPin} 
                value={formData.neighborhood} 
                onChangeText={(text: string) => setFormData({...formData, neighborhood: text})} 
                placeholder="Bairro" 
              />
              <DefaultView style={styles.row}>
                <DefaultView style={{ flex: 2, marginRight: 8 }}>
                  <InputField 
                    label="Cidade *" 
                    icon={MapPin} 
                    value={formData.city} 
                    onChangeText={(text: string) => setFormData({...formData, city: text})} 
                    placeholder="Cidade" 
                  />
                </DefaultView>
                <DefaultView style={{ flex: 1 }}>
                  <InputField 
                    label="Estado *" 
                    icon={MapPin} 
                    value={formData.state} 
                    onChangeText={(text: string) => setFormData({...formData, state: text.toUpperCase()})} 
                    placeholder="UF" 
                    maxLength={2}
                    autoCapitalize="characters"
                  />
                </DefaultView>
              </DefaultView>
              <InputField 
                label="CEP" 
                icon={MapPin} 
                value={formData.zipCode} 
                onChangeText={(text: string) => setFormData({...formData, zipCode: text})} 
                placeholder="00000-000" 
                keyboardType="numeric"
              />
            </DefaultView>
            
            <DefaultView style={{ height: 100 }} />
          </ScrollView>

          <DefaultView style={[styles.footer, { backgroundColor: backgroundColor, borderTopColor: borderColor }]}>
            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: primaryColor, shadowColor: primaryColor }]} 
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Save size={20} color="#fff" style={{ marginRight: 8 }} />
                  <DefaultText style={styles.saveButtonText}>CADASTRAR CLIENTE</DefaultText>
                </>
              )}
            </TouchableOpacity>
          </DefaultView>
        </DefaultView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    height: '92%',
    borderWidth: 1,
  },
  dragIndicator: {
    width: 40,
    height: 5,
    borderRadius: 10,
    alignSelf: 'center',
    marginTop: 12,
  },
  header: {
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderTopWidth: 1,
  },
  saveButton: {
    height: 58,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  }
});
