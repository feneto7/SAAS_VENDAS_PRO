"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Map, Truck, Loader2 } from "lucide-react";
import { RouteList } from "./RouteList";
import { RouteModal } from "./RouteModal";
import { CobrancasList } from "./CobrançasList";
import type { Route } from "@/types/route.types";
import { Pagination } from "@/components/dashboard/shared/Pagination";

interface RoutesTabProps {
  serverUrl: string;
  tenantSlug: string;
}

export function RoutesTab({ serverUrl, tenantSlug }: RoutesTabProps) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Drill-down state
  const [activeRouteId, setActiveRouteId] = useState<string | null>(null);
  const [activeRouteName, setActiveRouteName] = useState<string>("");

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({ 
        name: search,
        page: currentPage.toString(),
        limit: "10"
      });
      const res = await fetch(`${serverUrl}/api/routes?${query}`, {
        headers: { "x-tenant-slug": tenantSlug }
      });
      if (res.ok) {
        const data = await res.json();
        setRoutes(data.items || []);
        setTotalPages(data.pagination?.pages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!activeRouteId) {
      fetchRoutes();
    }
  }, [search, currentPage, activeRouteId]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  const handleEdit = (route: Route) => {
    setSelectedRoute(route);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedRoute(undefined);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const res = await fetch(`${serverUrl}/api/routes/${id}/toggle-status`, {
        method: "POST",
        headers: { "x-tenant-slug": tenantSlug }
      });
      if (res.ok) fetchRoutes();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenRoute = (route: Route) => {
    setActiveRouteId(route.id);
    setActiveRouteName(route.name);
  };

  if (activeRouteId) {
    return (
      <CobrancasList 
        routeId={activeRouteId}
        routeName={activeRouteName}
        serverUrl={serverUrl}
        tenantSlug={tenantSlug}
        onBack={() => setActiveRouteId(null)}
      />
    );
  }

  return (
    <div className="nm-flex-col nm-gap-lg nm-animate-fade-in">

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h1 className="nm-heading" style={{ fontSize: "var(--nm-text-2xl)" }}>Gestão de Rotas</h1>
          <p className="nm-caption" style={{ marginTop: "0.25rem" }}>Controle seus setores de venda e periodicidade de cobrança.</p>
        </div>

        <button id="btn-nova-rota" className="nm-btn nm-btn--accent nm-btn--sm" onClick={handleAddNew}>
          <Plus size={15} />
          Nova Rota
        </button>
      </div>

      {/* Filtros */}
      <div className="nm-card nm-card--sm" style={{ zIndex: 20, marginBottom: 0, overflow: "visible", padding: "1rem" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingBottom: "0.4rem", marginRight: "0.5rem" }}>
            <div className="nm-icon-circle nm-icon-circle--sm" style={{ color: "var(--nm-accent)" }}>
              <Search size={14} />
            </div>
            <span style={{ fontSize: "var(--nm-text-sm)", fontWeight: 600, color: "var(--nm-text-primary)" }}>Filtros</span>
          </div>

          <div className="nm-input-group" style={{ flex: 1, minWidth: "250px" }}>
            <label className="nm-input-group__label">Busca Geral</label>
            <input
              type="text"
              placeholder="Pesquisar rota..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="nm-input"
              style={{ padding: "0.4rem 0.75rem", fontSize: "var(--nm-text-sm)" }}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="nm-flex-center" style={{ minHeight: "12rem" }}>
          <div className="nm-icon-circle nm-icon-circle--glow nm-icon-circle--lg nm-icon-circle--double">
            <Loader2 size={24} style={{ animation: "nm-spin 0.7s linear infinite" }} />
          </div>
        </div>
      ) : (
        <RouteList
          routes={routes}
          onEdit={handleEdit}
          onToggleStatus={handleToggleStatus}
          onOpenRoute={handleOpenRoute}
        />
      )}

      {!loading && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          loading={loading}
        />
      )}

      <RouteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchRoutes}
        route={selectedRoute}
        serverUrl={serverUrl}
        tenantSlug={tenantSlug}
      />
    </div>
  );
}
