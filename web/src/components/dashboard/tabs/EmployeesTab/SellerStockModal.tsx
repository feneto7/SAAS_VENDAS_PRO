"use client";

import { useState, useEffect } from "react";
import { X, Package, PackageOpen, AlertCircle, RefreshCw, Box, Search, Sliders } from "lucide-react";
import { Pagination } from "@/components/dashboard/shared/Pagination";
import { Employee } from "@/types/employee.types";

interface SellerStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  serverUrl: string;
  tenantSlug: string;
}

interface StockItem {
  productId: string;
  productName: string;
  stock: number;
  sku: string | null;
  category: string | null;
}

export function SellerStockModal({ isOpen, onClose, employee, serverUrl, tenantSlug }: SellerStockModalProps) {
  const [stock, setStock] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  
  // Adjustment Mode state
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [editedStock, setEditedStock] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isOpen && employee) {
      fetchStock(1);
    } else if (!isOpen) {
      setSearchTerm("");
      setPagination({ page: 1, pages: 1, total: 0 });
      setIsAdjusting(false);
      setEditedStock({});
    }
  }, [isOpen, employee]);

  useEffect(() => {
    if (!isOpen || !employee || isAdjusting) return;
    const timer = setTimeout(() => {
      fetchStock(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (!isOpen || !employee || isAdjusting) return;
    fetchStock(pagination.page);
  }, [pagination.page]);

  async function fetchStock(page = 1) {
    if (!employee) return;
    try {
      setLoading(true);
      setError(null);
      const query = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search: searchTerm,
      });
      const res = await fetch(`${serverUrl}/api/inventory/seller/${employee.id}?${query.toString()}`, {
        headers: { "x-tenant-slug": tenantSlug },
      });
      if (!res.ok) throw new Error("Erro ao buscar estoque");
      const data = await res.json();
      setStock(data.items || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
      
      // Initialize edited labels if empty
      const initialEdited: Record<string, number> = {};
      (data.items || []).forEach((item: StockItem) => {
        initialEdited[item.productId] = item.stock;
      });
      setEditedStock(prev => ({ ...prev, ...initialEdited }));
    } catch (err) {
      console.error(err);
      setError("Não foi possível carregar o estoque deste vendedor.");
    } finally {
      setLoading(false);
    }
  }

  const handleToggleAdjustment = () => {
    if (!isAdjusting) {
      // Entering adjustment mode
      setIsAdjusting(true);
    } else {
      // Canceling adjustment mode
      setIsAdjusting(false);
    }
  };

  const handleQuantityChange = (productId: string, value: string) => {
    const val = parseInt(value) || 0;
    setEditedStock(prev => ({ ...prev, [productId]: val }));
  };

  const saveAdjustments = async () => {
    if (!employee) return;
    try {
      setLoading(true);
      const itemsToAdjust = stock.map(item => ({
        productId: item.productId,
        quantity: editedStock[item.productId] ?? item.stock
      }));

      const res = await fetch(`${serverUrl}/api/inventory/adjustment`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-tenant-slug": tenantSlug 
        },
        body: JSON.stringify({
          sellerId: employee.id,
          description: `Ajuste manual via Painel Administrativo`,
          items: itemsToAdjust
        })
      });

      if (!res.ok) throw new Error("Erro ao salvar ajuste");
      
      setIsAdjusting(false);
      fetchStock(pagination.page);
    } catch (err) {
      console.error(err);
      setError("Erro ao salvar ajustes.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-[#0c0c0c] border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <header className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-emerald-500/5 to-transparent">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
              <Package className="text-emerald-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Estoque Atual</h2>
              <p className="text-sm text-gray-500 font-medium">{employee?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-all">
            <X size={24} />
          </button>
        </header>

        {/* Search Bar & Actions */}
        <div className="px-8 py-4 border-b border-white/5 bg-white/[0.02] flex items-center gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-emerald-400 transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Pesquisar por SKU ou Nome do Produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isAdjusting}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.08] transition-all disabled:opacity-50"
            />
          </div>
          
          <button 
            onClick={handleToggleAdjustment}
            className={`flex items-center gap-2 px-6 py-3 border rounded-2xl text-sm font-bold transition-all active:scale-95 ${
              isAdjusting 
                ? "bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20" 
                : "bg-white/5 border-white/10 text-gray-300 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400"
            }`}
          >
            {isAdjusting ? <X size={18} /> : <Sliders size={18} />}
            {isAdjusting ? "Cancelar" : "Ajuste"}
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[60vh] custom-scrollbar">
          {loading && !isAdjusting ? (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
              <RefreshCw className="animate-spin text-emerald-500 mb-4" size={32} />
              <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Carregando Estoque...</p>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl flex flex-col items-center text-center gap-4">
              <AlertCircle className="text-red-500" size={32} />
              <p className="text-sm text-red-200">{error}</p>
              <button 
                onClick={() => fetchStock(pagination.page)}
                className="py-2 px-4 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-all"
              >
                Tentar Novamente
              </button>
            </div>
          ) : stock.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
              <PackageOpen size={64} className="mb-4 text-gray-500" />
              <p className="text-sm font-bold uppercase tracking-widest">Vendedor sem produtos em estoque</p>
            </div>
          ) : (
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
              <div className="divide-y divide-white/5">
                {stock.map((item) => (
                  <div 
                    key={item.productId}
                    className="flex items-center justify-between px-4 py-2 hover:bg-white/[0.04] transition-colors group"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="flex items-center gap-2 min-w-0">
                        {item.sku && (
                          <span className="text-[10px] font-mono text-emerald-400 font-bold shrink-0">{item.sku}</span>
                        )}
                        {item.sku && <span className="text-gray-600 font-bold text-xs">-</span>}
                        <span className="text-xs font-bold text-gray-300 truncate group-hover:text-white transition-colors">
                          {item.productName}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 shrink-0 ml-4">
                      {isAdjusting ? (
                        <input 
                          type="number"
                          value={editedStock[item.productId] ?? item.stock}
                          onChange={(e) => handleQuantityChange(item.productId, e.target.value)}
                          className="w-16 bg-white/5 border border-white/20 rounded-lg py-1 px-2 text-xs font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                        />
                      ) : (
                        <div className={`text-sm font-black ${item.stock <= 0 ? 'text-red-500' : 'text-emerald-400'}`}>
                          {item.stock}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="p-8 border-t border-white/5 bg-black/40 flex items-center justify-between">
          <div className="flex-1">
            {!isAdjusting && pagination.pages > 1 && (
              <Pagination 
                currentPage={pagination.page}
                totalPages={pagination.pages}
                onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))}
                loading={loading}
              />
            )}
            {isAdjusting && (
                <div className="flex items-center gap-2 text-emerald-400">
                    <AlertCircle size={16} />
                    <span className="text-xs font-bold uppercase">Modo de Ajuste Ativo</span>
                </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {isAdjusting ? (
                <button 
                  onClick={saveAdjustments}
                  disabled={loading}
                  className="py-3 px-8 bg-emerald-500 text-sm font-bold text-black rounded-2xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                >
                  {loading && <RefreshCw size={16} className="animate-spin" />}
                  Salvar Ajuste
                </button>
            ) : (
                <button 
                  onClick={onClose}
                  className="py-3 px-8 bg-white/5 text-sm font-bold text-white rounded-2xl hover:bg-white/10 transition-all"
                >
                  Fechar
                </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
