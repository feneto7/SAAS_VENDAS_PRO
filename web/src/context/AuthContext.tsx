"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string;
}

interface Tenant {
  slug: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  tenant: Tenant | null;
  loading: boolean;
  login: (token: string, user: User, tenant: Tenant | null) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = async () => {
    console.log('[AuthContext] Refreshing user session...');
    const token = Cookies.get('vendas_token');
    
    if (!token) {
      console.log('[AuthContext] No token found.');
      setUser(null);
      setTenant(null);
      setLoading(false);
      return;
    }

    console.log('[AuthContext] Token detected, fetching /auth/me');

    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (resp.ok) {
        const data = await resp.json();
        console.log('[AuthContext] User refreshed:', data.user?.id);
        setUser(data.user);
        setTenant(data.tenant);
      } else {
        console.warn('[AuthContext] Token invalid or expired (status:', resp.status, ')');
        Cookies.remove('vendas_token');
        setUser(null);
        setTenant(null);
      }
    } catch (error) {
      console.error('[AuthContext] Failed to refresh user:', error);
      // Ensure state is cleared on error to prevent infinite spinners
      setUser(null);
      setTenant(null);
    } finally {
      console.log('[AuthContext] Loading finished.');
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = (token: string, user: User, tenant: Tenant | null) => {
    Cookies.set('vendas_token', token, { expires: 7 }); // 7 days
    setUser(user);
    setTenant(tenant);
  };

  const logout = () => {
    Cookies.remove('vendas_token');
    setUser(null);
    setTenant(null);
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, tenant, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
