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
    <div className="nm-modal-backdrop" onClick={onClose}>
      <div 
        className="nm-modal nm-modal--lg flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ margin: "auto", height: "85vh" }}
      >
        
        {/* Header */}
        <header className="nm-modal__header">
          <div className="flex items-center gap-4">
            <div className="nm-icon-circle nm-icon-circle--accent nm-icon-circle--lg">
              <Package size={24} />
            </div>
            <div>
              <h2 className="nm-modal__title">Estoque Atual</h2>
              <p className="nm-modal__subtitle font-medium">{employee?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="nm-modal__close">
            <X size={20} />
          </button>
        </header>

        {/* Search Bar & Actions */}
        <div className="px-6 py-4 flex items-center gap-4 shrink-0" style={{ borderBottom: "1px solid var(--nm-border)" }}>
          <div className="nm-input-group nm-input-group--with-icon flex-1">
            <div className="nm-input-group__icon">
              <Search size={16} />
            </div>
            <input 
              type="text"
              placeholder="Pesquisar por SKU ou Nome do Produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isAdjusting}
              className="nm-input nm-input--search"
            />
          </div>
          
          <button 
            onClick={handleToggleAdjustment}
            className="nm-btn nm-btn--flat"
            style={{ color: isAdjusting ? "var(--nm-danger)" : "var(--nm-text-primary)" }}
          >
            {isAdjusting ? <X size={18} /> : <Sliders size={18} />}
            {isAdjusting ? "Cancelar" : "Ajuste"}
          </button>
        </div>

        {/* Content */}
        <div className="nm-modal__body custom-scrollbar">
          {loading && !isAdjusting ? (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
              <RefreshCw className="animate-spin nm-text-accent mb-4" size={32} />
              <p className="nm-text-muted text-sm font-bold uppercase tracking-widest">Carregando Estoque...</p>
            </div>
          ) : error ? (
            <div className="nm-card nm-card--inset border-red-500/20 p-6 flex flex-col items-center text-center gap-4">
              <AlertCircle className="nm-text-danger" size={32} />
              <p className="text-sm nm-text-secondary">{error}</p>
              <button 
                onClick={() => fetchStock(pagination.page)}
                className="nm-btn nm-btn--flat" style={{ color: "var(--nm-danger)" }}
              >
                Tentar Novamente
              </button>
            </div>
          ) : stock.length === 0 ? (
            <div className="nm-card nm-card--inset flex flex-col items-center justify-center py-20 text-center opacity-50">
              <PackageOpen size={64} className="mb-4 nm-text-muted" />
              <p className="text-sm font-bold uppercase tracking-widest nm-text-muted">Vendedor sem produtos em estoque</p>
            </div>
          ) : (
            <div className="nm-table-container">
              <table className="nm-table">
                <thead>
                  <tr>
                    <th>Produto / SKU</th>
                    <th style={{ textAlign: "right" }}>Estoque</th>
                  </tr>
                </thead>
                <tbody>
                  {stock.map((item) => (
                    <tr key={item.productId} className="nm-table__row">
                      <td>
                        <div className="flex flex-col">
                          {item.sku && (
                            <span className="text-[10px] font-mono font-black nm-text-accent bg-black/10 dark:bg-white/5 px-2 py-0.5 rounded w-fit mb-1">
                              {item.sku}
                            </span>
                          )}
                          <p className="text-sm font-bold nm-text-secondary group-hover:nm-text-primary transition-colors truncate">
                            {item.productName}
                          </p>
                        </div>
                      </td>
                      
                      <td style={{ textAlign: "right" }}>
                        {isAdjusting ? (
                          <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            <input 
                              type="number"
                              value={editedStock[item.productId] ?? item.stock}
                              onChange={(e) => handleQuantityChange(item.productId, e.target.value)}
                              className="nm-input nm-input--raised"
                              style={{ width: "90px", textAlign: "center", padding: "0.4rem" }}
                            />
                          </div>
                        ) : (
                          <div className={`text-base font-black ${item.stock <= 0 ? 'nm-text-danger' : 'nm-text-success'}`}>
                            {item.stock} UN
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="nm-modal__footer">
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
                <div className="flex items-center gap-2 nm-text-accent">
                    <AlertCircle size={16} />
                    <span className="text-xs font-bold uppercase">Modo de Ajuste Ativo</span>
                </div>
            )}
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            {isAdjusting ? (
                <button 
                  onClick={saveAdjustments}
                  disabled={loading}
                  className="nm-btn nm-btn--accent"
                >
                  {loading && <RefreshCw size={16} className="animate-spin" />}
                  Salvar Ajuste
                </button>
            ) : (
                <button 
                  onClick={onClose}
                  className="nm-btn nm-btn--flat"
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
