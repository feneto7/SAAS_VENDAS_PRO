"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Plus, Link as LinkIcon } from "lucide-react";
import { SalesFilters } from "./SalesFilters";
import { SalesList }   from "./SalesList";
import { NewFichaModal } from "./NewFichaModal";
import { FichaLinkModal } from "./FichaLinkModal";
import { FichaDetailModal } from "./FichaDetailModal";
import type { FichaListItem, FichaFilters, Route } from "@/types/card.types";
import { EMPTY_FILTERS } from "@/types/card.types";
import { Pagination } from "@/components/dashboard/shared/Pagination";

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001";

interface SalesTabProps {
  tenantSlug: string;
}

export function SalesTab({ tenantSlug }: SalesTabProps) {
  const [cards,  setFichas]  = useState<FichaListItem[]>([]);
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

  useEffect(() => {
    fetch(`${SERVER_URL}/api/routes?limit=100`, { headers: { "x-tenant-slug": tenantSlug } })
      .then((r) => r.ok ? r.json() : { items: [] })
      .then(data => setRoutes(data.items || []))
      .catch(() => setRoutes([]));
  }, [tenantSlug]);

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

        const res = await fetch(`${SERVER_URL}/api/cards?${params.toString()}`, {
          headers: { "x-tenant-slug": tenantSlug },
        });
        if (res.ok) {
          const data = await res.json();
          setFichas(data.items || []);
          setTotalCount(data.pagination?.total || 0);
          setTotalPages(data.pagination?.pages || 1);
          setOrdersCount(data.stats?.ordersCount || 0);
        }
      } catch (err) {
        console.error("Erro ao buscar cards:", err);
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
      const res = await fetch(`${SERVER_URL}/api/cards/${id}`, {
        method: "DELETE",
        headers: { "x-tenant-slug": tenantSlug },
      });
      if (res.ok) {
        fetchFichas(filters);
      }
    } catch {
      /* silencioso */
    }
  };

  return (
    <div className="nm-flex-col nm-gap-lg nm-animate-fade-in">

      {/* Cabeçalho da aba */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h1 className="nm-heading text-xl md:text-2xl">Fichas de Venda</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.35rem" }}>
            <span className="nm-caption">
              {loading ? "Carregando..." : `${totalCount} card${totalCount !== 1 ? "s" : ""} encontrada${totalCount !== 1 ? "s" : ""}`}
            </span>
            {!loading && ordersCount > 0 && (
              <>
                <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "var(--nm-border)" }} />
                <span className="nm-badge nm-badge--success nm-badge--sm">
                  <span className="nm-badge__dot" />
                  {ordersCount} pedido{ordersCount !== 1 ? "s" : ""}
                </span>
              </>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <button
            id="btn-card-link"
            className="nm-btn nm-btn--ghost nm-btn--sm"
            onClick={() => setIsLinkModalOpen(true)}
          >
            <LinkIcon size={15} />
            Ficha Link
          </button>
          <button
            id="btn-nova-card"
            className="nm-btn nm-btn--accent nm-btn--sm"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={15} />
            Nova Ficha
          </button>
        </div>
      </div>

      {/* Filtros */}
      <SalesFilters
        filters={filters}
        routes={routes}
        onChange={handleFilterChange}
        onReset={() => handleFilterChange(EMPTY_FILTERS)}
      />

      {/* Lista */}
      <SalesList
        cards={cards}
        loading={loading}
        tenantSlug={tenantSlug}
        onDelete={handleDeleteFicha}
        onFichaClick={(card) => {
          setSelectedFichaId(card.id);
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
        onSuccess={() => { setIsLinkModalOpen(false); fetchFichas(filters); }}
        tenantSlug={tenantSlug}
      />
      <FichaDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => { setIsDetailModalOpen(false); setSelectedFichaId(null); }}
        cardId={selectedFichaId}
        tenantSlug={tenantSlug}
      />
    </div>
  );
}
