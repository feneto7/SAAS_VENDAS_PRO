import { useState } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTenant } from '@/lib/TenantContext';
import { formatCurrencyBRL } from '@/lib/utils/money';

export interface CardItem {
  id: string; 
  productId: string;
  name: string;
  type: 'CC' | 'SC' | 'BRINDE';
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export function useNewCard() {
  const { clientId } = useLocalSearchParams();
  const { tenantSlug, activeTrip, seller } = useTenant();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<CardItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const addItem = (item: any) => {
    const newItem: CardItem = {
      ...item,
      id: Math.random().toString(36).substring(7),
    };
    setItems(prev => [...prev, newItem]);
    setModalVisible(false);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const totalCard = items.reduce((acc, i) => acc + i.subtotal, 0);

  const handleFinalize = async () => {
    if (items.length === 0) return;

    Alert.alert(
      "Confirmar Ficha",
      `Deseja finalizar esta ficha no valor de ${formatCurrencyBRL(totalCard)}?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Confirmar", 
          onPress: async () => {
            try {
              setLoading(true);
              const apiURL = process.env.EXPO_PUBLIC_API_URL;
              
              const payload = {
                clientId,
                sellerId: seller?.id,
                routeId: activeTrip?.routeId,
                cobrancaId: activeTrip?.id,
                total: totalCard,
                notes: "",
                items: items.map(i => ({
                  productId: i.productId,
                  quantity: i.quantity,
                  unitPrice: i.unitPrice,
                  commissionType: i.type 
                }))
              };

              const res = await fetch(`${apiURL}/api/fichas`, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'x-tenant-slug': tenantSlug || ''
                },
                body: JSON.stringify(payload)
              });

              if (res.ok) {
                Alert.alert("Sucesso", "Ficha criada com sucesso!");
                router.back();
              } else {
                const errData = await res.json();
                Alert.alert("Erro", errData.error || "Erro ao criar ficha");
              }
            } catch (err) {
              console.error('Finalize card failed:', err);
              Alert.alert("Erro", "Falha de conexão com o servidor");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return {
    items,
    loading,
    modalVisible,
    setModalVisible,
    addItem,
    removeItem,
    totalCard,
    handleFinalize,
    seller
  };
}
