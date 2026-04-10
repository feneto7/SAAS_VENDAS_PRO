export interface Product {
  id: string;
  sku: string | null;
  name: string;
  category: string | null;
  brand: string | null;
  stockDeposit: number;
  costPrice: number;
  priceCC: number;
  priceSC: number;
  createdAt: string;
  
  // Calculated fields from API
  subtotalCusto: number;
  subtotalCC: number;
  subtotalSC: number;
}

export interface ProductStats {
  totalCost: number;
  totalCC: number;
  totalSC: number;
}

export interface ProductFilters {
  descricao: string;
  categoria: string;
  marca: string;
  sku: string;
}
