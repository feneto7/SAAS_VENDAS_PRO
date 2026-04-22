import { create } from 'zustand';
import { db } from '../services/database';

interface AuthState {
  tenant: { id: string; name: string; slug: string } | null;
  user: { id: string; name: string; sellerCode: string } | null;
  token: string | null;
  setTenant: (tenant: { id: string; name: string; slug: string } | null) => void;
  setAuth: (user: { id: string; name: string; sellerCode: string }, token: string) => void;
  logout: () => void;
  loadFromDb: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  tenant: null,
  user: null,
  token: null,

  setTenant: (tenant) => {
    set({ tenant });
    if (tenant) {
      try {
        db.runSync(
          'INSERT OR REPLACE INTO tenants (id, name, slug) VALUES (?, ?, ?)',
          [tenant.id, tenant.name, tenant.slug]
        );
      } catch (e) {
        console.warn('Could not persist tenant:', e);
      }
    }
  },

  setAuth: (user, token) => {
    const { tenant } = useAuthStore.getState();
    set({ user, token });
    try {
      db.runSync(
        'INSERT OR REPLACE INTO auth (id, user_id, name, seller_code, token, tenant_id, logged_in) VALUES (1, ?, ?, ?, ?, ?, 1)',
        [user.id, user.name, user.sellerCode, token, tenant?.id || null]
      );
    } catch (e) {
      console.warn('Could not persist auth:', e);
    }
  },

  logout: () => {
    set({ user: null, token: null });
    try {
      db.runSync('UPDATE auth SET logged_in = 0 WHERE id = 1');
    } catch (e) {}
  },

  loadFromDb: () => {
    try {
      const result = db.getFirstSync('SELECT * FROM auth WHERE id = 1 AND logged_in = 1') as any;
      if (result) {
        let tenantData = null;
        if (result.tenant_id) {
          const tenantRecord = db.getFirstSync('SELECT * FROM tenants WHERE id = ?', [result.tenant_id]) as any;
          if (tenantRecord) {
            tenantData = { id: tenantRecord.id, name: tenantRecord.name, slug: tenantRecord.slug };
          }
        }

        set({
          user: { id: result.user_id, name: result.name, sellerCode: result.seller_code },
          token: result.token,
          tenant: tenantData
        });
      }
    } catch (e) {
      console.warn('Could not load auth from db:', e);
    }
  },
}));
