"use client";

import { useState, useEffect, useRef } from "react";
import { X, ChevronRight, ChevronLeft, Search, Package, Save, Trash2, ArrowRight, AlertCircle, Warehouse, User, Download, Plus } from "lucide-react";
import { formatCentsToBRL, applyCurrencyMask, parseBRLToCents } from "@/utils/money";
import type { Product } from "@/types/product.types";

interface StockInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  serverUrl: string;
  tenantSlug: string;
}

interface SelectedItem {
  productId: string;
  sku: string;
  name: string;
  costPrice: string; // Formatted mask value
  quantity: string;
}

export function StockInModal({ isOpen, onClose, onSuccess, serverUrl, tenantSlug }: StockInModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [employees, setEmployees] = useState<any[]>([]);
  
  // Selection state
  const [entryType, setEntryType] = useState<"propria" | "fornecedor">("propria");
  const [supplier, setSupplier] = useState("");
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  // Confirmation state for cancel
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Body scroll prevent
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  // Fetch employees (sellers)
  useEffect(() => {
    if (isOpen) {
      fetch(`${serverUrl}/api/employees?role=seller`, { headers: { "x-tenant-slug": tenantSlug } })
        .then(res => res.json())
        .then(data => setEmployees(data.items || []))
        .catch(console.error);
    }
  }, [isOpen]);

  // Fetch products for Step 2
  async function fetchProducts(page = 1) {
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        descricao: search,
      });
      const res = await fetch(`${serverUrl}/api/products?${query.toString()}`, {
        headers: { "x-tenant-slug": tenantSlug },
      });
      const data = await res.json();
      setProducts(data.items || []);
      setPagination(data.pagination || { page: 1, total: 0, pages: 1 });
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    if (step === 2) fetchProducts(pagination.page);
  }, [step, pagination.page, search]);

  if (!isOpen) return null;

  const handleSelectItem = (p: Product) => {
    if (selectedItems.find(i => i.productId === p.id)) return;
    
    setSelectedItems([...selectedItems, {
      productId: p.id,
      sku: p.sku || "",
      name: p.name,
      costPrice: applyCurrencyMask(p.costPrice.toString()),
      quantity: "1",
    }]);
  };

  const updateItem = (productId: string, field: keyof SelectedItem, value: string) => {
    setSelectedItems(selectedItems.map(item => 
      item.productId === productId ? { ...item, [field]: value } : item
    ));
  };

  const removeItem = (productId: string) => {
    setSelectedItems(selectedItems.filter(i => i.productId !== productId));
  };

  const calculateTotal = () => {
    return selectedItems.reduce((acc, item) => {
      const q = Number(item.quantity) || 0;
      const c = parseBRLToCents(item.costPrice);
      return acc + (q * c);
    }, 0);
  };

  async function handleFinalize(destination: "deposito" | "vendedor", sellerId?: string) {
    try {
      setLoading(true);
      const res = await fetch(`${serverUrl}/api/stock-entries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-slug": tenantSlug,
        },
        body: JSON.stringify({
          type: entryType,
          supplier: entryType === "fornecedor" ? supplier : null,
          destination,
          sellerId,
          items: selectedItems.map(i => ({
            productId: i.productId,
            quantity: i.quantity,
            costPrice: parseBRLToCents(i.costPrice)
          }))
        }),
      });

      if (res.ok) {
        onSuccess();
        onClose();
        reset();
      } else {
        alert("Erro ao finalizar entrada");
      }
    } catch (err) {
      console.error(err);
      alert("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  const reset = () => {
    setStep(1);
    setEntryType("propria");
    setSupplier("");
    setSelectedItems([]);
    setSearch("");
  };

  const handleCancelClick = () => {
    if (selectedItems.length > 0) {
      setShowCancelConfirm(true);
    } else {
      onClose();
    }
  };

  const labelClass = "block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest";
  const inputClass = "w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 focus:bg-white/[0.08] outline-none transition-all";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={handleCancelClick} />

      {/* Modal Card */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0c0c0c] border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <header className="p-8 border-b border-white/5 flex items-center justify-between shrink-0 bg-gradient-to-r from-emerald-500/5 to-transparent">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
              <Download className="text-emerald-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Entrada de Estoque</h2>
              <div className="flex items-center gap-2 mt-1">
                {[1, 2, 3].map((s) => (
                  <div key={s} className={`h-1 rounded-full transition-all ${s === step ? 'w-8 bg-emerald-500' : 'w-2 bg-white/10'}`} />
                ))}
                <span className="ml-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest">Passo {step} de 3</span>
              </div>
            </div>
          </div>
          <button onClick={handleCancelClick} className="p-2 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-all">
            <X size={24} />
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          
          {/* STEP 1: Identification */}
          {step === 1 && (
            <div className="max-w-md mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div>
                <label className={labelClass}>Tipo de Entrada</label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setEntryType("propria")}
                    className={`p-4 rounded-2xl border flex flex-col items-center gap-3 transition-all ${entryType === 'propria' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10'}`}
                  >
                    <Warehouse size={24} />
                    <span className="text-sm font-bold">Entrada Própria</span>
                  </button>
                  <button 
                    onClick={() => setEntryType("fornecedor")}
                    className={`p-4 rounded-2xl border flex flex-col items-center gap-3 transition-all ${entryType === 'fornecedor' ? 'bg-purple-500/10 border-purple-500/50 text-purple-400' : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10'}`}
                  >
                    <Package size={24} />
                    <span className="text-sm font-bold">Fornecedor</span>
                  </button>
                </div>
              </div>

              {entryType === "fornecedor" && (
                <div className="animate-in slide-in-from-top-4">
                  <label className={labelClass}>Nome do Fornecedor</label>
                  <input 
                    className={inputClass}
                    placeholder="Ex: Ambev LTDA"
                    value={supplier}
                    onChange={e => setSupplier(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Products Selection */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-3.5 text-gray-500" size={18} />
                  <input 
                    className={`${inputClass} pl-12`}
                    placeholder="Pesquisar por SKU, Descrição ou Categoria..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Available Products */}
                <div className="space-y-4">
                  <label className={labelClass}>Produtos Disponíveis</label>
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden min-h-[400px]">
                    <table className="w-full text-left">
                      <thead className="bg-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-white/5">
                        <tr>
                          <th className="p-4">SKU / Descrição</th>
                          <th className="p-4 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {products.map(p => (
                          <tr key={p.id} className="group hover:bg-white/[0.04] transition-colors">
                            <td className="p-4">
                              <div className="flex flex-col">
                                <span className="text-[9px] font-mono text-emerald-400 font-bold">{p.sku || 'SEM SKU'}</span>
                                <span className="text-sm font-bold text-white leading-tight">{p.name}</span>
                                <span className="text-[9px] text-gray-500 uppercase font-bold">{p.category}</span>
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              <button 
                                onClick={() => handleSelectItem(p)}
                                disabled={!!selectedItems.find(i => i.productId === p.id)}
                                className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-30"
                              >
                                <Plus size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    {/* Pagination */}
                    <div className="p-4 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[10px] text-gray-500 uppercase font-bold">Total: {pagination.total}</span>
                      <div className="flex items-center gap-2">
                        <button 
                          disabled={pagination.page <= 1}
                          onClick={() => setPagination({...pagination, page: pagination.page - 1})}
                          className="p-1.5 hover:bg-white/5 rounded-lg disabled:opacity-30"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <span className="text-xs font-bold">{pagination.page} / {pagination.pages}</span>
                        <button 
                          disabled={pagination.page >= pagination.pages}
                          onClick={() => setPagination({...pagination, page: pagination.page + 1})}
                          className="p-1.5 hover:bg-white/5 rounded-lg disabled:opacity-30"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Selection Bucket */}
                <div className="space-y-4">
                  <label className={labelClass}>Itens na Entrada ({selectedItems.length})</label>
                  <div className="bg-emerald-500/[0.02] border border-emerald-500/10 rounded-2xl overflow-hidden min-h-[400px]">
                    <div className="p-4 space-y-4">
                      {selectedItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
                          <Package size={48} className="mb-4" />
                          <p className="text-xs font-bold uppercase">Nenhum item selecionado</p>
                        </div>
                      ) : (
                        selectedItems.map(item => (
                          <div key={item.productId} className="bg-white/5 border border-white/5 p-4 rounded-xl space-y-3 relative group">
                            <button 
                              onClick={() => removeItem(item.productId)}
                              className="absolute top-4 right-4 text-gray-500 hover:text-red-400"
                            >
                              <Trash2 size={16} />
                            </button>
                            <div>
                              <span className="text-[9px] font-mono text-emerald-400 font-bold">{item.sku}</span>
                              <h4 className="text-sm font-bold text-white">{item.name}</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-[9px] text-gray-500 font-black uppercase mb-1 block">Custo Unit.</label>
                                <div className="relative">
                                  <span className="absolute left-2.5 top-2.5 text-[10px] text-gray-500 font-bold">R$</span>
                                  <input 
                                    className="w-full bg-black/40 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                                    value={item.costPrice}
                                    onChange={e => updateItem(item.productId, "costPrice", applyCurrencyMask(e.target.value))}
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="text-[9px] text-gray-500 font-black uppercase mb-1 block">Qtd.</label>
                                <input 
                                  type="number"
                                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                                  value={item.quantity}
                                  onChange={e => updateItem(item.productId, "quantity", e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="pt-2 flex justify-between items-center border-t border-white/5">
                              <span className="text-xs text-gray-500 font-bold">Subtotal:</span>
                              <span className="text-xs font-black text-emerald-400">
                                {formatCentsToBRL(parseBRLToCents(item.costPrice) * (Number(item.quantity) || 0))}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Finalization */}
          {step === 3 && (
            <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-8 rounded-3xl text-center">
                <span className="text-xs text-emerald-400 font-black uppercase tracking-[0.2em]">Custo Total da Entrada</span>
                <div className="text-5xl font-black text-white mt-2 tracking-tighter">
                  {formatCentsToBRL(calculateTotal())}
                </div>
                <div className="mt-4 flex items-center justify-center gap-6 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                  <span>{selectedItems.length} Itens</span>
                  <span>•</span>
                  <span>{entryType === 'propria' ? 'Entrada Própria' : `Fornecedor: ${supplier}`}</span>
                </div>
              </div>

              <div className="space-y-4">
                <label className={labelClass}>Finalizar e Enviar para:</label>
                <div className="grid grid-cols-1 gap-3">
                  <button 
                    disabled={loading}
                    onClick={() => handleFinalize("deposito")}
                    className="group bg-white/[0.03] border border-white/10 hover:border-emerald-500/50 p-6 rounded-2xl flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors">
                        <Warehouse className="text-gray-400 group-hover:text-emerald-400" size={24} />
                      </div>
                      <div className="text-left">
                        <span className="text-sm font-bold text-white block">Estoque Depósito</span>
                        <span className="text-[10px] text-gray-500 font-bold uppercase">Lançar saldo no depósito central</span>
                      </div>
                    </div>
                    <ArrowRight className="text-gray-600 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <div className="space-y-3">
                    <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest block text-center">Ou enviar para um vendedor específico</span>
                    <div className="grid grid-cols-2 gap-3">
                      {employees.map(seller => (
                        <button 
                          key={seller.id}
                          disabled={loading}
                          onClick={() => handleFinalize("vendedor", seller.id)}
                          className="group bg-white/[0.03] border border-white/10 hover:border-purple-500/50 p-4 rounded-2xl flex items-center gap-3 transition-all"
                        >
                          <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center group-hover:bg-purple-500/10 transition-colors">
                            <User className="text-gray-400 group-hover:text-purple-400" size={18} />
                          </div>
                          <div className="text-left">
                            <span className="text-xs font-bold text-white block leading-tight">{seller.name}</span>
                            <span className="text-[9px] text-gray-500 font-bold uppercase">Cod: {seller.appCode || '-'}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <footer className="p-8 border-t border-white/5 bg-black/40 flex items-center justify-between shrink-0">
          <button 
            type="button"
            onClick={step === 1 ? handleCancelClick : () => setStep(step - 1)}
            className="flex items-center gap-2 py-3 px-6 text-sm font-bold text-gray-400 hover:text-white transition-all disabled:opacity-30"
          >
            {step === 1 ? 'Cancelar' : <><ChevronLeft size={18} /> Anterior</>}
          </button>

          {step < 3 ? (
            <button 
              disabled={step === 2 && selectedItems.length === 0}
              onClick={() => setStep(step + 1)}
              className="group bg-white text-black py-3 px-8 rounded-2xl text-sm font-black flex items-center gap-2 hover:bg-emerald-400 transition-all active:scale-95 disabled:opacity-30"
            >
              Próximo
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <div className="text-[10px] text-gray-600 font-black uppercase tracking-widest animate-pulse">
              Selecione o destino acima para finalizar
            </div>
          )}
        </footer>
      </div>

      {/* Confirmation Modal for Cancel */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowCancelConfirm(false)} />
          <div className="relative bg-[#1a1a1a] border border-white/10 p-8 rounded-[2rem] max-w-sm w-full text-center space-y-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
              <AlertCircle size={32} className="text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Cancelar Entrada?</h3>
              <p className="text-sm text-gray-400">Todo o progresso desta entrada será perdido. Deseja continuar?</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setShowCancelConfirm(false)}
                className="py-3 px-4 bg-white/5 text-xs font-bold text-white rounded-xl hover:bg-white/10 transition-all"
              >
                Não, Voltar
              </button>
              <button 
                onClick={() => {
                  setShowCancelConfirm(false);
                  onClose();
                  reset();
                }}
                className="py-3 px-4 bg-red-500 text-xs font-bold text-white rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
              >
                Sim, Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
