"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Users, MapPin, Loader2, Map, X } from "lucide-react";
import { ClientList } from "./ClientList";
import { ClientModal } from "./ClientModal";
import { ClientDetailView } from "./ClientDetailView";
import type { Client, ClientFilters } from "@/types/client.types";
import type { Route } from "@/types/route.types";
import { Pagination } from "@/components/dashboard/shared/Pagination";
import { CustomSelect } from "@/components/dashboard/shared/CustomSelect";

interface ClientsTabProps {
  serverUrl: string;
  tenantSlug: string;
}

export function ClientsTab({ serverUrl, tenantSlug }: ClientsTabProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ClientFilters>({
    name: "",
    state: "",
    city: "",
    street: "",
    routeId: ""
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Drill-down state
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [activeClientName, setActiveClientName] = useState<string>("");

  const fetchClients = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams(filters as any);
      query.append("page", currentPage.toString());
      query.append("limit", "10");
      
      const res = await fetch(`${serverUrl}/api/clients?${query}`, {
        headers: { "x-tenant-slug": tenantSlug }
      });
      if (res.ok) {
        const data = await res.json();
        setClients(data.items || []);
        setTotalPages(data.pagination?.pages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoutes = async () => {
    try {
      const res = await fetch(`${serverUrl}/api/routes?limit=100`, {
        headers: { "x-tenant-slug": tenantSlug }
      });
      if (res.ok) {
        const data = await res.json();
        setRoutes(data.items || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!activeClientId) {
      fetchRoutes();
    }
  }, [activeClientId]);

  useEffect(() => {
    if (!activeClientId) {
      const timer = setTimeout(() => fetchClients(), 500);
      return () => clearTimeout(timer);
    }
  }, [filters, currentPage, activeClientId]);

  const handleFilterChange = (newFilters: ClientFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const res = await fetch(`${serverUrl}/api/clients/${id}/toggle-status`, {
        method: "POST",
        headers: { "x-tenant-slug": tenantSlug }
      });
      if (res.ok) fetchClients();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenClient = (client: Client) => {
    setActiveClientId(client.id);
    setActiveClientName(client.name);
  };

  if (activeClientId) {
    return (
      <ClientDetailView 
        clientId={activeClientId}
        clientName={activeClientName}
        serverUrl={serverUrl}
        tenantSlug={tenantSlug}
        onBack={() => setActiveClientId(null)}
      />
    );
  }

  return (
    <div className="nm-flex-col nm-gap-lg nm-animate-fade-in">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h1 className="nm-heading" style={{ fontSize: "var(--nm-text-2xl)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Users size={24} style={{ color: "var(--nm-accent)" }} />
            Gestão de Clientes
          </h1>
          <p className="nm-caption" style={{ marginTop: "0.25rem" }}>Controle sua base de clientes e vínculos com rotas.</p>
        </div>

        <button
          onClick={() => { setSelectedClient(undefined); setIsModalOpen(true); }}
          className="nm-btn nm-btn--accent nm-btn--sm"
        >
          <Plus size={15} />
          Novo Cliente
        </button>
      </div>

      {/* Advanced Filters */}
      <div className="nm-card nm-card--sm" style={{ zIndex: 20, marginBottom: 0, overflow: "visible", padding: "1rem" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "1rem", flexWrap: "wrap" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingBottom: "0.4rem", marginRight: "0.5rem" }}>
            <div className="nm-icon-circle nm-icon-circle--sm" style={{ color: "var(--nm-accent)" }}>
              <Search size={14} />
            </div>
            <span style={{ fontSize: "var(--nm-text-sm)", fontWeight: 600, color: "var(--nm-text-primary)" }}>Filtros</span>
            {Object.values(filters).some(v => v !== "") && <span className="nm-badge nm-badge--accent nm-badge--sm">ativos</span>}
          </div>

          <div className="nm-input-group" style={{ flex: 1, minWidth: "140px" }}>
            <label className="nm-input-group__label">Nome</label>
            <input className="nm-input" style={{ padding: "0.4rem 0.75rem", fontSize: "var(--nm-text-sm)" }} placeholder="Buscar por nome..."
              value={filters.name} onChange={e => handleFilterChange({ ...filters, name: e.target.value })} />
          </div>

          <div className="nm-input-group" style={{ flex: 1, minWidth: "100px" }}>
            <label className="nm-input-group__label">Estado</label>
            <input className="nm-input" style={{ padding: "0.4rem 0.75rem", fontSize: "var(--nm-text-sm)" }} placeholder="Ex: SC"
              value={filters.state} onChange={e => handleFilterChange({ ...filters, state: e.target.value })} />
          </div>

          <div className="nm-input-group" style={{ flex: 1, minWidth: "120px" }}>
            <label className="nm-input-group__label">Cidade</label>
            <input className="nm-input" style={{ padding: "0.4rem 0.75rem", fontSize: "var(--nm-text-sm)" }} placeholder="Ex: Florianópolis"
              value={filters.city} onChange={e => handleFilterChange({ ...filters, city: e.target.value })} />
          </div>

          <div className="nm-input-group" style={{ flex: 1, minWidth: "120px" }}>
            <label className="nm-input-group__label">Rua</label>
            <input className="nm-input" style={{ padding: "0.4rem 0.75rem", fontSize: "var(--nm-text-sm)" }} placeholder="Ex: Av. Central"
              value={filters.street} onChange={e => handleFilterChange({ ...filters, street: e.target.value })} />
          </div>

          <div className="nm-input-group" style={{ flex: 1, minWidth: "140px" }}>
            <label className="nm-input-group__label">Rota</label>
            <CustomSelect
              options={[
                { value: "", label: "Todas as Rotas" },
                ...routes.map(r => ({ value: r.id, label: r.name }))
              ]}
              value={filters.routeId}
              onChange={val => handleFilterChange({ ...filters, routeId: val })}
              className="sm"
            />
          </div>

          {Object.values(filters).some(v => v !== "") && (
            <button onClick={() => handleFilterChange({ name: "", state: "", city: "", street: "", routeId: "" })} className="nm-btn nm-btn--flat nm-btn--xs"
              style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.4rem 0.75rem", height: "34px", flexShrink: 0 }}>
              <X size={12} /> Limpar
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="nm-flex-center" style={{ minHeight: "12rem" }}>
          <div className="nm-icon-circle nm-icon-circle--glow nm-icon-circle--lg nm-icon-circle--double">
            <Loader2 size={24} style={{ animation: "nm-spin 0.7s linear infinite" }} />
          </div>
        </div>
      ) : (
        <ClientList
          clients={clients}
          onEdit={(c) => { setSelectedClient(c); setIsModalOpen(true); }}
          onToggleStatus={handleToggleStatus}
          onOpenClient={handleOpenClient}
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

      <ClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchClients}
        client={selectedClient}
        routes={routes}
        serverUrl={serverUrl}
        tenantSlug={tenantSlug}
      />
    </div>
  );
}
