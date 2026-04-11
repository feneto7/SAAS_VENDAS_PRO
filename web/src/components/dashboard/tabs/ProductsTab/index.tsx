"use client";

import { useEffect, useState } from "react";
import { ProductFilters as FilterComponent } from "./ProductFilters";
import { ProductStatsCards } from "./ProductStatsCards";
import { ProductList } from "./ProductList";
import { ProductModal } from "./ProductModal";
import { StockInModal } from "./StockInModal";
import { Plus, Download } from "lucide-react";
import type { Product, ProductFilters, ProductStats } from "@/types/product.types";
import { Pagination } from "@/components/dashboard/shared/Pagination";

interface ProductsTabProps {
  serverUrl: string;
  tenantSlug: string;
}

const initialFilters: ProductFilters = {
  descricao: "",
  categoria: "",
  marca: "",
  sku: "",
};

const initialStats: ProductStats = {
  totalCost: 0,
  totalCC: 0,
  totalSC: 0,
};

export function ProductsTab({ serverUrl, tenantSlug }: ProductsTabProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<ProductStats>(initialStats);
  const [filters, setFilters] = useState<ProductFilters>(initialFilters);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStockInOpen, setIsStockInOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  async function fetchProducts() {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (filters.descricao) query.append("descricao", filters.descricao);
      if (filters.categoria) query.append("categoria", filters.categoria);
      if (filters.marca)     query.append("marca",     filters.marca);
      if (filters.sku)       query.append("sku",       filters.sku);
      query.append("page", currentPage.toString());
      query.append("limit", "10");

      const res = await fetch(`${serverUrl}/api/products?${query.toString()}`, {
        headers: { "x-tenant-slug": tenantSlug },
      });

      if (res.ok) {
        const data = await res.json();
        setProducts(data.items || []);
        setStats(data.stats || initialStats);
        setTotalPages(data.pagination?.pages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  }

  // Debounce effect for searching
  useEffect(() => {
    const timer = setTimeout(fetchProducts, 400);
    return () => clearTimeout(timer);
  }, [filters, currentPage]);

  const handleFilterChange = (newFilters: ProductFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <header className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white">Estoque de Produtos</h1>
          <p className="text-gray-500 text-xs lg:text-sm">
            {products.length} produtos encontrados
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setIsStockInOpen(true)}
            className="flex-1 sm:flex-none justify-center bg-white/5 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-white/10 transition-all border border-white/10 active:scale-95"
          >
            <Download size={18} className="text-emerald-400" />
            Entrada
          </button>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-1 sm:flex-none justify-center bg-white text-black px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-200 transition-all shadow-lg active:scale-95"
          >
            <Plus size={18} />
            Novo
          </button>
        </div>
      </header>

      {/* 1. Filtros */}
      <FilterComponent 
        filters={filters} 
        onChange={handleFilterChange} 
        onReset={() => handleFilterChange(initialFilters)} 
      />

      {/* 2. Estatísticas Gerais */}
      <ProductStatsCards stats={stats} />

      {/* 3. Listagem */}
      <ProductList products={products} loading={loading} />

      {/* Pagination */}
      <Pagination 
        currentPage={currentPage} 
        totalPages={totalPages} 
        onPageChange={setCurrentPage}
        loading={loading}
      />

      {/* 4. Modal de Cadastro */}
      <ProductModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchProducts}
        serverUrl={serverUrl}
        tenantSlug={tenantSlug}
      />

      {/* 5. Modal de Entrada (Stock In) */}
      <StockInModal
        isOpen={isStockInOpen}
        onClose={() => setIsStockInOpen(false)}
        onSuccess={fetchProducts}
        serverUrl={serverUrl}
        tenantSlug={tenantSlug}
      />
    </div>
  );
}
