import React, { useState } from 'react';
import { 
  View, 
  Text, 
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
  Loader2
} from 'lucide-react-native';
import { useTenant } from '../../lib/TenantContext';

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}
const InputField = ({ label, icon: Icon, value, onChangeText, placeholder, keyboardType = 'default', maxLength }: any) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={styles.inputWrapper}>
      <Icon size={18} color="rgba(255,255,255,0.3)" style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.2)"
        keyboardType={keyboardType}
        maxLength={maxLength}
      />
    </View>
  </View>
);

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
      const apiURL = process.env.EXPO_PUBLIC_API_URL;
      const res = await fetch(`${apiURL}/api/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantSlug || '',
        },
        body: JSON.stringify({
          ...formData,
          routeId: activeTrip.routeId,
          sellerId: seller?.id // Vinculando ao vendedor logado como solicitado
        }),
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert('Sucesso', 'Cliente cadastrado com sucesso!');
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
      } else {
        Alert.alert('Erro', data.message || 'Falha ao cadastrar cliente.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Erro de conexão com o servidor.');
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
        <View style={styles.modalContent}>
          <View style={styles.dragIndicator} />
          
          <View style={styles.header}>
            <View style={styles.headerTitleContainer}>
              <View style={styles.headerIconContainer}>
                <User size={20} color="#3b82f6" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Novo Cliente</Text>
                <Text style={styles.headerSubtitle}>VINCULADO À ROTA ATUAL</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Identificação</Text>
              <InputField 
                label="Nome Completo *" 
                icon={User} 
                value={formData.name} 
                onChangeText={(text: string) => setFormData({...formData, name: text})} 
                placeholder="Ex: João da Silva" 
              />
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <InputField 
                    label="CPF / CNPJ" 
                    icon={CreditCard} 
                    value={formData.cpf} 
                    onChangeText={(text: string) => setFormData({...formData, cpf: text})} 
                    placeholder="000.000.000-00" 
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <InputField 
                    label="Telefone" 
                    icon={Phone} 
                    value={formData.phone} 
                    onChangeText={(text: string) => setFormData({...formData, phone: text})} 
                    placeholder="(00) 00000-0000" 
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Endereço</Text>
              <View style={styles.row}>
                <View style={{ flex: 3, marginRight: 8 }}>
                  <InputField 
                    label="Rua / Logradouro *" 
                    icon={Home} 
                    value={formData.street} 
                    onChangeText={(text: string) => setFormData({...formData, street: text})} 
                    placeholder="Rua..." 
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <InputField 
                    label="Nº" 
                    icon={MapPin} 
                    value={formData.number} 
                    onChangeText={(text: string) => setFormData({...formData, number: text})} 
                    placeholder="123" 
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <InputField 
                label="Bairro" 
                icon={MapPin} 
                value={formData.neighborhood} 
                onChangeText={(text: string) => setFormData({...formData, neighborhood: text})} 
                placeholder="Bairro" 
              />
              <View style={styles.row}>
                <View style={{ flex: 2, marginRight: 8 }}>
                  <InputField 
                    label="Cidade *" 
                    icon={MapPin} 
                    value={formData.city} 
                    onChangeText={(text: string) => setFormData({...formData, city: text})} 
                    placeholder="Cidade" 
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <InputField 
                    label="Estado *" 
                    icon={MapPin} 
                    value={formData.state} 
                    onChangeText={(text: string) => setFormData({...formData, state: text.toUpperCase()})} 
                    placeholder="UF" 
                    maxLength={2}
                    autoCapitalize="characters"
                  />
                </View>
              </View>
              <InputField 
                label="CEP" 
                icon={MapPin} 
                value={formData.zipCode} 
                onChangeText={(text: string) => setFormData({...formData, zipCode: text})} 
                placeholder="00000-000" 
                keyboardType="numeric"
              />
            </View>
            
            <View style={{ height: 100 }} />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <Save size={20} color="#000" style={{ marginRight: 8 }} />
                  <Text style={styles.saveButtonText}>CADASTRAR CLIENTE</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0c0c0c',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    height: '92%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  dragIndicator: {
    width: 40,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
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
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(59,130,246,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.2)',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: 'rgba(59,130,246,0.6)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
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
    color: 'rgba(255,255,255,0.4)',
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
    color: 'rgba(255,255,255,0.3)',
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
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
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
    backgroundColor: '#0c0c0c',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  saveButton: {
    backgroundColor: '#fff',
    height: 58,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButtonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  }
});
