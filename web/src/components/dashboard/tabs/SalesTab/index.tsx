"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Plus, Link as LinkIcon } from "lucide-react";
import { SalesFilters } from "./SalesFilters";
import { SalesList }   from "./SalesList";
import { NewFichaModal } from "./NewFichaModal";
import { FichaLinkModal } from "./FichaLinkModal";
import { FichaDetailModal } from "./FichaDetailModal";
import type { FichaListItem, FichaFilters, Route } from "@/types/ficha.types";
import { EMPTY_FILTERS } from "@/types/ficha.types";
import { Pagination } from "@/components/dashboard/shared/Pagination";
import { formatCentsToBRL } from "@/utils/money";

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001";

interface SalesTabProps {
  tenantSlug: string;
}

function buildQueryString(filters: FichaFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, val]) => {
    if (val) params.set(key, val);
  });
  params.set("limit", "10");
  return params.toString();
}

export function SalesTab({ tenantSlug }: SalesTabProps) {
  const [fichas,  setFichas]  = useState<FichaListItem[]>([]);
  const [routes,  setRoutes]  = useState<Route[]>([]);
  const [filters, setFilters] = useState<FichaFilters>(EMPTY_FILTERS);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedFichaId, setSelectedFichaId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const debounceRef = useRef<any>(null);

  // Fetch available routes for the filter dropdown
  useEffect(() => {
    fetch(`${SERVER_URL}/api/routes?limit=100`, { headers: { "x-tenant-slug": tenantSlug } })
      .then((r) => r.ok ? r.json() : { items: [] })
      .then(data => setRoutes(data.items || []))
      .catch(() => setRoutes([]));
  }, [tenantSlug]);

  // Fetch fichas whenever filters change (debounced 400ms)
  const fetchFichas = useCallback((activeFilters: FichaFilters) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        Object.entries(activeFilters).forEach(([key, val]) => {
          if (val) params.set(key, val as string);
        });
        params.set("limit", "10");
        params.set("page", currentPage.toString());
        
        const res = await fetch(
          `${SERVER_URL}/api/fichas?${params.toString()}`,
          { headers: { "x-tenant-slug": tenantSlug } }
        );
        if (res.ok) {
          const data = await res.json();
          setFichas(data.items || []);
          setTotalCount(data.pagination?.total || 0);
          setTotalPages(data.pagination?.pages || 1);
          setOrdersCount(data.stats?.ordersCount || 0);
        }
      } catch (err) {
        console.error("Erro ao buscar fichas:", err);
      } finally {
        setLoading(false);
      }
    }, 400);
  }, [tenantSlug, currentPage]);

  useEffect(() => {
    fetchFichas(filters);
  }, [filters, fetchFichas, currentPage]);

  const handleFilterChange = (newFilters: FichaFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleDeleteFicha = async (id: string) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/fichas/${id}`, {
        method: 'DELETE',
        headers: { 'x-tenant-slug': tenantSlug }
      });
      if (res.ok) {
        fetchFichas(filters);
      } else {
        alert("Erro ao excluir ficha");
      }
    } catch (err) {
      alert("Erro de conexão");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page title + summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            Fichas de Venda
          </h1>
          <div className="flex items-center gap-4 mt-0.5">
            <p className="text-sm text-gray-500">
              {loading ? "Carregando..." : `${totalCount} ficha${totalCount !== 1 ? "s" : ""} encontrada${totalCount !== 1 ? "s" : ""}`}
            </p>
            <div className="w-1 h-1 rounded-full bg-white/10 hidden sm:block" />
            <p className="text-sm text-emerald-400 font-medium">
              {loading ? "" : `${ordersCount} pedido${ordersCount !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsLinkModalOpen(true)}
            className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-6 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-purple-500 hover:text-white transition-all active:scale-95"
          >
            <LinkIcon size={16} />
            Ficha Link
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-white text-black px-6 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-emerald-400 transition-all active:scale-95 shadow-lg shadow-white/5"
          >
            <Plus size={16} />
            Nova Ficha
          </button>
        </div>
      </div>

      {/* Filters */}
      <SalesFilters
        filters={filters}
        routes={routes}
        onChange={handleFilterChange}
        onReset={() => handleFilterChange(EMPTY_FILTERS)}
      />

      {/* List */}
      <SalesList
        fichas={fichas}
        loading={loading}
        tenantSlug={tenantSlug}
        onDelete={handleDeleteFicha}
        onFichaClick={(ficha) => {
          setSelectedFichaId(ficha.id);
          setIsDetailModalOpen(true);
        }}
      />

      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        loading={loading}
      />

      <NewFichaModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchFichas(filters)}
        tenantSlug={tenantSlug}
      />
      <FichaLinkModal 
        isOpen={isLinkModalOpen} 
        onClose={() => setIsLinkModalOpen(false)} 
        onSuccess={() => {
          setIsLinkModalOpen(false);
          fetchFichas(filters);
        }}
        tenantSlug={tenantSlug}
      />
      <FichaDetailModal 
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedFichaId(null);
        }}
        fichaId={selectedFichaId}
        tenantSlug={tenantSlug}
      />
    </div>
  );
}
