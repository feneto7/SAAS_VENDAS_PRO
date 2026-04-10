"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { SalesFilters } from "./SalesFilters";
import { SalesList }   from "./SalesList";
import type { FichaListItem, FichaFilters, Route } from "@/types/ficha.types";
import { EMPTY_FILTERS } from "@/types/ficha.types";
import { Pagination } from "@/components/dashboard/shared/Pagination";

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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
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
        const qs  = buildQueryString(activeFilters);
        const res = await fetch(
          `${SERVER_URL}/api/fichas${qs ? `?${qs}` : ""}`,
          { headers: { "x-tenant-slug": tenantSlug } }
        );
        if (res.ok) {
          const data = await res.json();
          setFichas(data.items || []);
          setTotalCount(data.pagination?.total || 0);
          setTotalPages(data.pagination?.pages || 1);
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

  // Stats summary
  const total = fichas.length;
  const totalValue = fichas
    .filter((f) => f.status === "paga")
    .reduce((acc, f) => acc + Number(f.total), 0);

  return (
    <div className="space-y-6">
      {/* Page title + summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Fichas de Venda</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? "Carregando..." : `${totalCount} ficha${totalCount !== 1 ? "s" : ""} encontrada${totalCount !== 1 ? "s" : ""}`}
          </p>
        </div>
        {!loading && total > 0 && (
          <div className="bg-white/[0.03] border border-white/8 rounded-xl px-4 py-2.5 text-right shrink-0">
            <p className="text-xs text-gray-500">Total recebido (pagas)</p>
            <p className="text-lg font-bold text-emerald-400">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalValue)}
            </p>
          </div>
        )}
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
        onFichaClick={(ficha) => console.log("Ficha selecionada:", ficha.id)}
      />

      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        loading={loading}
      />
    </div>
  );
}
