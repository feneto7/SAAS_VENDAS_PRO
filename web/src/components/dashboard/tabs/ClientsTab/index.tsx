"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Users, MapPin, Loader2, Map } from "lucide-react";
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

  const labelClass = "text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block ml-1";
  const inputClass = "w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:border-purple-500 outline-none transition-all";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <Users className="text-purple-400" />
            Gestão de Clientes
          </h1>
          <p className="text-gray-500 text-sm">Controle sua base de clientes e vínculos com rotas.</p>
        </div>
        
        <button 
          onClick={() => { setSelectedClient(undefined); setIsModalOpen(true); }}
          className="bg-white text-black px-6 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 hover:bg-purple-400 transition-all active:scale-95 shadow-lg shadow-white/5"
        >
          <Plus size={18} />
          Novo Cliente
        </button>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white/[0.02] border border-white/5 p-6 rounded-[2rem] backdrop-blur-sm relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className={labelClass}>Nome</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-600" size={14} />
              <input 
                className={`${inputClass} pl-9`}
                placeholder="Buscar por nome..."
                value={filters.name}
                onChange={e => handleFilterChange({ ...filters, name: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Estado</label>
            <input 
              className={inputClass}
              placeholder="Ex: SC"
              value={filters.state}
              onChange={e => handleFilterChange({ ...filters, state: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass}>Cidade</label>
            <input 
              className={inputClass}
              placeholder="Ex: Florianópolis"
              value={filters.city}
              onChange={e => handleFilterChange({ ...filters, city: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass}>Rua / Logradouro</label>
            <input 
              className={inputClass}
              placeholder="Ex: Av. Central"
              value={filters.street}
              onChange={e => handleFilterChange({ ...filters, street: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass}>Rota</label>
            <CustomSelect
              options={[
                { value: "", label: "Todas as Rotas" },
                ...routes.map(r => ({ value: r.id, label: r.name }))
              ]}
              value={filters.routeId}
              onChange={val => handleFilterChange({ ...filters, routeId: val })}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
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
