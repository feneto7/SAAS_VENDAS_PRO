// ─── Enums ────────────────────────────────────────────────────────────────────

export type FichaStatus = 'nova' | 'pendente' | 'paga' | 'link_gerado' | 'pedido';

// ─── API Response Types ───────────────────────────────────────────────────────

export interface FichaListItem {
  id: string;
  code: string | null;
  status: FichaStatus;
  total: string;
  saleDate: string;
  notes: string | null;
  createdAt: string;
  // Client
  clientId: string;
  clientName: string;
  clientPhone: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  // Seller
  sellerId: string;
  sellerName: string | null;
  sellerEmail: string;
  // Route
  routeId: string;
  routeName: string;
  linkToken: string | null;
}

export interface FichaItem {
  id: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
  productId: string;
  productName: string;
}

export interface FichaDetail extends FichaListItem {
  items: FichaItem[];
}

// ─── Filter Types ─────────────────────────────────────────────────────────────

export interface FichaFilters {
  cliente: string;
  vendedor: string;
  rotaId: string;
  estado: string;
  cidade: string;
  rua: string;
  status: FichaStatus | '';
  dataInicio: string;
  dataFim: string;
}

export const EMPTY_FILTERS: FichaFilters = {
  cliente:    '',
  vendedor:   '',
  rotaId:     '',
  estado:     '',
  cidade:     '',
  rua:        '',
  status:     '',
  dataInicio: '',
  dataFim:    '',
};

// ─── Route Type ───────────────────────────────────────────────────────────────

export interface Route {
  id: string;
  name: string;
  description: string | null;
}
