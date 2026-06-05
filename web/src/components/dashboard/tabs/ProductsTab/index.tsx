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

const initialFilters: ProductFilters = { descricao: "", categoria: "", marca: "", sku: "" };
const initialStats: ProductStats = { totalCost: 0, totalCC: 0, totalSC: 0 };

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
      query.append("page",  currentPage.toString());
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

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 400);
    return () => clearTimeout(timer);
  }, [filters, currentPage]);

  const handleFilterChange = (newFilters: ProductFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  return (
    <div className="nm-flex-col nm-gap-lg nm-animate-fade-in">

      {/* Cabeçalho */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h1 className="nm-heading" style={{ fontSize: "var(--nm-text-2xl)" }}>Estoque de Produtos</h1>
          <span className="nm-caption" style={{ marginTop: "0.25rem", display: "block" }}>
            {loading ? "Carregando..." : `${products.length} produto${products.length !== 1 ? "s" : ""} encontrado${products.length !== 1 ? "s" : ""}`}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <button
            id="btn-estoque-entrada"
            className="nm-btn nm-btn--sm nm-btn--ghost"
            onClick={() => setIsStockInOpen(true)}
          >
            <Download size={15} style={{ color: "var(--nm-success)" }} />
            Entrada
          </button>
          <button
            id="btn-novo-produto"
            className="nm-btn nm-btn--sm nm-btn--accent"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={15} />
            Novo
          </button>
        </div>
      </div>

      {/* Stats */}
      <ProductStatsCards stats={stats} />

      {/* Filtros */}
      <FilterComponent
        filters={filters}
        onChange={handleFilterChange}
        onReset={() => handleFilterChange(initialFilters)}
      />

      {/* Lista */}
      <ProductList products={products} loading={loading} />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        loading={loading}
      />

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchProducts}
        serverUrl={serverUrl}
        tenantSlug={tenantSlug}
      />
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
