"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Map, Truck, Loader2 } from "lucide-react";
import { RouteList } from "./RouteList";
import { RouteModal } from "./RouteModal";
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
    fetchRoutes();
  }, [search, currentPage]);

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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Grid */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestão de Rotas</h1>
          <p className="text-gray-500 text-sm">Controle seus setores de venda e periodicidade de cobrança.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
            <input 
              className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:border-purple-500 outline-none transition-all w-64"
              placeholder="Pesquisar rota..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          <button 
            onClick={handleAddNew}
            className="bg-white text-black px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-purple-400 transition-all active:scale-95"
          >
            <Plus size={18} />
            Nova Rota
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      ) : (
        <RouteList 
          routes={routes} 
          onEdit={handleEdit} 
          onToggleStatus={handleToggleStatus} 
        />
      )}

      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        loading={loading}
      />

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
