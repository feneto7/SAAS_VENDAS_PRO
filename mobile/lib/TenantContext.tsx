import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Seller {
  id: string;
  name: string;
  appCode: string;
  routeIds?: string[];
}

interface ActiveTrip {
  id: string;
  routeId: string;
  code: number;
}

interface TenantContextType {
  tenantSlug: string | null;
  companyName: string | null;
  seller: Seller | null;
  token: string | null;
  activeTrip: ActiveTrip | null;
  loading: boolean;
  setTenant: (slug: string, name?: string) => Promise<void>;
  clearTenant: () => Promise<void>;
  loginSeller: (seller: Seller, token: string) => Promise<void>;
  logout: () => Promise<void>;
  setActiveTrip: (trip: ActiveTrip | null) => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

const TENANT_STORAGE_KEY = '@vendas_pro_tenant_slug';
const COMPANY_NAME_KEY  = '@vendas_pro_company_name';
const SELLER_STORAGE_KEY = '@vendas_pro_seller_info';
const TOKEN_STORAGE_KEY  = '@vendas_pro_auth_token';
const ACTIVE_TRIP_KEY   = '@vendas_pro_active_trip';

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeTrip, setActiveTripState] = useState<ActiveTrip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      try {
        const [storedTenant, storedName, storedSeller, storedToken, storedTrip] = await Promise.all([
          AsyncStorage.getItem(TENANT_STORAGE_KEY),
          AsyncStorage.getItem(COMPANY_NAME_KEY),
          AsyncStorage.getItem(SELLER_STORAGE_KEY),
          AsyncStorage.getItem(TOKEN_STORAGE_KEY),
          AsyncStorage.getItem(ACTIVE_TRIP_KEY)
        ]);

        if (storedTenant) setTenantSlug(storedTenant);
        if (storedName)   setCompanyName(storedName);
        if (storedSeller) setSeller(JSON.parse(storedSeller));
        if (storedToken)  setToken(storedToken);
        if (storedTrip)   setActiveTripState(JSON.parse(storedTrip));

        // If we have a tenant but no name, try to fetch it
        if (storedTenant && !storedName) {
          const apiURL = process.env.EXPO_PUBLIC_API_URL;
          if (apiURL) {
            const res = await fetch(`${apiURL}/tenant/info`, {
              headers: { 'x-tenant-slug': storedTenant }
            });
            if (res.ok) {
              const data = await res.json();
              setCompanyName(data.name);
              await AsyncStorage.setItem(COMPANY_NAME_KEY, data.name);
            }
          }
        }

      } catch (e) {
        console.error('Failed to load session info', e);
      } finally {
        setLoading(false);
      }
    }
    loadSession();
  }, []);

  const setTenant = async (slug: string, name?: string) => {
    try {
      await AsyncStorage.setItem(TENANT_STORAGE_KEY, slug);
      if (name) {
        await AsyncStorage.setItem(COMPANY_NAME_KEY, name);
        setCompanyName(name);
      }
      setTenantSlug(slug);
    } catch (e) {
      console.error('Failed to save tenant slug', e);
      throw e;
    }
  };

  const loginSeller = async (sellerData: Seller, authToken: string) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(SELLER_STORAGE_KEY, JSON.stringify(sellerData)),
        AsyncStorage.setItem(TOKEN_STORAGE_KEY, authToken)
      ]);
      setSeller(sellerData);
      setToken(authToken);
    } catch (e) {
      console.error('Failed to save seller login info', e);
      throw e;
    }
  };

  const logout = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(SELLER_STORAGE_KEY),
        AsyncStorage.removeItem(TOKEN_STORAGE_KEY),
        AsyncStorage.removeItem(ACTIVE_TRIP_KEY)
      ]);
      setSeller(null);
      setToken(null);
      setActiveTripState(null);
    } catch (e) {
      console.error('Failed to logout', e);
    }
  };

  const setActiveTrip = async (trip: ActiveTrip | null) => {
    try {
      if (trip) {
        await AsyncStorage.setItem(ACTIVE_TRIP_KEY, JSON.stringify(trip));
      } else {
        await AsyncStorage.removeItem(ACTIVE_TRIP_KEY);
      }
      setActiveTripState(trip);
    } catch (e) {
      console.error('Failed to set active trip', e);
    }
  };

  const clearTenant = async () => {
    try {
      await logout();
      await Promise.all([
        AsyncStorage.removeItem(TENANT_STORAGE_KEY),
        AsyncStorage.removeItem(COMPANY_NAME_KEY)
      ]);
      setTenantSlug(null);
      setCompanyName(null);
    } catch (e) {
      console.error('Failed to clear tenant slug', e);
    }
  };

  return (
    <TenantContext.Provider value={{ 
      tenantSlug, 
      companyName,
      seller, 
      token, 
      activeTrip,
      loading, 
      setTenant, 
      clearTenant,
      loginSeller,
      logout,
      setActiveTrip
    }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
