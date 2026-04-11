"use client";

import { useState, useEffect, useRef } from "react";
import { X, ChevronRight, ChevronLeft, Search, Package, Save, Trash2, ArrowRight, AlertCircle, Warehouse, User, Download, Plus, ShoppingCart, List } from "lucide-react";
import { formatCentsToBRL, applyCurrencyMask, parseBRLToCents } from "@/utils/money";
import type { Product } from "@/types/product.types";
import { useIsMobile } from "@/hooks/useIsMobile";

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
  const isMobile = useIsMobile();
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
  const [activeMobileTab, setActiveMobileTab] = useState<"catalog" | "cart">("catalog");

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
    setActiveMobileTab("catalog");
  };

  const handleCancelClick = () => {
    if (selectedItems.length > 0) setShowCancelConfirm(true);
    else onClose();
  };

  const labelClass = "block text-xs font-black text-gray-500 mb-2 uppercase tracking-[0.2em]";
  const inputClass = "w-full bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-4 text-sm text-white focus:border-emerald-500 focus:bg-white/[0.08] outline-none transition-all placeholder:text-gray-600";

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/95 backdrop-blur-xl animate-in fade-in duration-500" 
        onClick={handleCancelClick} 
      />

      {/* Modal Container */}
      <div className="relative w-full h-[98vh] sm:h-auto sm:max-h-[90vh] sm:max-w-6xl bg-[#0c0c0c] border-t sm:border border-white/10 rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-500 ease-out">
        
        {/* Mobile Handle */}
        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-4 mb-2 sm:hidden shrink-0" />

        {/* Header */}
        <header className="px-6 py-4 sm:p-8 border-b border-white/5 flex items-center justify-between shrink-0 bg-gradient-to-r from-emerald-500/5 to-transparent">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-14 sm:h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/5 transition-all">
              <Download className="text-emerald-400" size={isMobile ? 20 : 28} />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight leading-none">Entrada</h2>
              <div className="flex items-center gap-2 mt-2">
                {[1, 2, 3].map((s) => (
                  <div key={s} className={`h-1 rounded-full transition-all duration-500 ${s === step ? 'w-8 bg-emerald-500' : 'w-2 bg-white/10'}`} />
                ))}
                <span className="ml-2 text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">Passo {step}</span>
              </div>
            </div>
          </div>
          <button onClick={handleCancelClick} className="p-2 sm:p-3 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-all active:scale-90">
            <X size={24} />
          </button>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar relative">
          
          {/* STEP 1: Identification */}
          {step === 1 && (
            <div className="max-w-xl mx-auto space-y-10 py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center space-y-2">
                <h3 className="text-xl sm:text-2xl font-black text-white">Como esta carga chegou?</h3>
                <p className="text-xs sm:text-sm text-gray-500 font-medium">Selecione a origem para começar a registrar os itens.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button 
                  onClick={() => setEntryType("propria")}
                  className={`group p-6 sm:p-8 rounded-[2.5rem] border-2 flex flex-col items-center gap-5 transition-all active:scale-95 ${entryType === 'propria' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-2xl shadow-emerald-500/10' : 'bg-white/[0.02] border-white/5 text-gray-500 hover:bg-white/5 hover:border-white/10'}`}
                >
                  <div className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all ${entryType === 'propria' ? 'bg-emerald-500 text-black rotate-3' : 'bg-white/5'}`}>
                    <Warehouse size={32} />
                  </div>
                  <div className="text-center">
                    <span className="text-base sm:text-lg font-black block group-hover:text-white transition-colors">Entrada Própria</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Direto do estoque</span>
                  </div>
                </button>

                <button 
                  onClick={() => setEntryType("fornecedor")}
                  className={`group p-6 sm:p-8 rounded-[2.5rem] border-2 flex flex-col items-center gap-5 transition-all active:scale-95 ${entryType === 'fornecedor' ? 'bg-purple-500/10 border-purple-500 text-purple-400 shadow-2xl shadow-purple-500/10' : 'bg-white/[0.02] border-white/5 text-gray-500 hover:bg-white/5 hover:border-white/10'}`}
                >
                  <div className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all ${entryType === 'fornecedor' ? 'bg-purple-500 text-black -rotate-3' : 'bg-white/5'}`}>
                    <Package size={32} />
                  </div>
                  <div className="text-center">
                    <span className="text-base sm:text-lg font-black block group-hover:text-white transition-colors">Fornecedor</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Compra externa</span>
                  </div>
                </button>
              </div>

              {entryType === "fornecedor" && (
                <div className="animate-in slide-in-from-top-4 duration-500 max-w-sm mx-auto w-full">
                  <label className={labelClass}>Nome do Fornecedor</label>
                  <input 
                    className={inputClass}
                    placeholder="Ex: Distribuidora Central"
                    value={supplier}
                    onChange={e => setSupplier(e.target.value)}
                    autoFocus
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Products Selection */}
          {step === 2 && (
            <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500">
              
              {/* Search bar */}
              <div className="relative group">
                <Search className="absolute left-4 top-4 text-gray-500 group-focus-within:text-emerald-500 transition-colors" size={20} />
                <input 
                  className={`${inputClass} pl-14`}
                  placeholder="Buscar por nome, SKU ou categoria..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              {/* Mobile Tabs Switcher */}
              {isMobile && (
                <div className="flex bg-white/5 p-1 rounded-2xl shrink-0">
                  <button 
                    onClick={() => setActiveMobileTab("catalog")}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeMobileTab === 'catalog' ? 'bg-white text-black shadow-lg shadow-white/5' : 'text-gray-500'}`}
                  >
                    <List size={14} />
                    Catálogo
                  </button>
                  <button 
                    onClick={() => setActiveMobileTab("cart")}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeMobileTab === 'cart' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-gray-500'}`}
                  >
                    <ShoppingCart size={14} />
                    Carrinho ({selectedItems.length})
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-0">
                
                {/* Available Products / Catalog */}
                <div className={`${isMobile && activeMobileTab !== 'catalog' ? 'hidden' : 'block'} flex flex-col space-y-4`}>
                  <div className="flex items-center justify-between shrink-0">
                    <label className={labelClass}>Catálogo de Produtos</label>
                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{pagination.total} itens</span>
                  </div>

                  <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] overflow-hidden flex flex-col min-h-0 relative">
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                      <table className="w-full text-left">
                        <thead className="sticky top-0 bg-[#121212] z-10 text-[9px] font-black text-gray-600 uppercase tracking-widest border-b border-white/5">
                          <tr>
                            <th className="p-5">Produto</th>
                            {!isMobile && <th className="p-5">Categoria</th>}
                            <th className="p-5 text-right w-20">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                          {products.map(p => {
                            const isSelected = !!selectedItems.find(i => i.productId === p.id);
                            return (
                              <tr key={p.id} className="group hover:bg-white/[0.03] transition-all">
                                <td className="p-5">
                                  <div className="flex flex-col">
                                    <span className="text-[10px] font-mono text-emerald-500/60 font-black mb-1">{p.sku || 'SEM SKU'}</span>
                                    <span className={`text-sm font-bold leading-tight transition-colors ${isSelected ? 'text-emerald-400' : 'text-gray-200 group-hover:text-white'}`}>{p.name}</span>
                                    {isMobile && <span className="text-[9px] text-gray-600 uppercase font-black mt-1 tracking-tighter">{p.category}</span>}
                                  </div>
                                </td>
                                {!isMobile && (
                                  <td className="p-5">
                                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{p.category}</span>
                                  </td>
                                )}
                                <td className="p-5 text-right">
                                  <button 
                                    onClick={() => handleSelectItem(p)}
                                    disabled={isSelected}
                                    className={`p-3 rounded-xl transition-all active:scale-90 ${isSelected ? 'bg-emerald-500/20 text-emerald-500 cursor-default' : 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-lg shadow-emerald-500/10'}`}
                                  >
                                    <Plus size={isMobile ? 18 : 16} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Pagination Bar */}
                    <div className="p-4 border-t border-white/5 flex items-center justify-between bg-black/40 shrink-0">
                      <button 
                        disabled={pagination.page <= 1}
                        onClick={() => setPagination({...pagination, page: pagination.page - 1})}
                        className="p-2 hover:bg-white/5 rounded-xl disabled:opacity-20 text-gray-400"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{pagination.page} de {pagination.pages}</span>
                      <button 
                        disabled={pagination.page >= pagination.pages}
                        onClick={() => setPagination({...pagination, page: pagination.page + 1})}
                        className="p-2 hover:bg-white/5 rounded-xl disabled:opacity-20 text-gray-400"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Selection Bucket / Cart */}
                <div className={`${isMobile && activeMobileTab !== 'cart' ? 'hidden' : 'block'} flex flex-col space-y-4`}>
                  <div className="flex items-center justify-between shrink-0">
                    <label className={labelClass}>Itens selecionados ({selectedItems.length})</label>
                    <button 
                      onClick={() => setSelectedItems([])}
                      className="text-[9px] font-black text-red-500/60 hover:text-red-500 uppercase tracking-[0.1em] transition-colors"
                    >
                      Limpar Tudo
                    </button>
                  </div>

                  <div className="bg-emerald-500/[0.02] border border-emerald-500/10 rounded-[2rem] overflow-hidden flex flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
                      {selectedItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-20">
                          <ShoppingCart size={64} className="mb-6 stroke-[1px]" />
                          <p className="text-xs font-black uppercase tracking-[0.3em] max-w-[150px]">O Carrinho está vazio</p>
                        </div>
                      ) : (
                        selectedItems.map(item => (
                          <div key={item.productId} className="bg-white/5 border border-white/5 p-5 rounded-[1.8rem] space-y-4 relative group hover:bg-white/[0.08] transition-all">
                            <button 
                              onClick={() => removeItem(item.productId)}
                              className="absolute top-5 right-5 text-gray-600 hover:text-red-500 transition-colors p-2"
                            >
                              <Trash2 size={16} />
                            </button>
                            
                            <div>
                              <span className="text-[9px] font-mono text-emerald-400/60 font-black">{item.sku}</span>
                              <h4 className="text-sm font-bold text-white truncate pr-10">{item.name}</h4>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <label className="text-[8px] text-gray-600 font-black uppercase tracking-widest pl-1">Custo Unitário</label>
                                <div className="relative">
                                  <span className="absolute left-3.5 top-2.5 text-[10px] text-emerald-500/50 font-black">R$</span>
                                  <input 
                                    className="w-full bg-black/40 border border-white/5 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500 transition-all font-bold"
                                    value={item.costPrice}
                                    onChange={e => updateItem(item.productId, "costPrice", applyCurrencyMask(e.target.value))}
                                  />
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[8px] text-gray-600 font-black uppercase tracking-widest pl-1">Quantidade</label>
                                <input 
                                  type="number"
                                  className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-emerald-500 transition-all font-black"
                                  value={item.quantity}
                                  onChange={e => updateItem(item.productId, "quantity", e.target.value)}
                                  min="1"
                                />
                              </div>
                            </div>
                            
                            <div className="pt-3 flex justify-between items-center border-t border-white/5">
                              <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest">Subtotal</span>
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
            <div className="max-w-3xl mx-auto space-y-10 py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Total Card */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-8 sm:p-12 rounded-[3rem] text-center shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-50" />
                <span className="relative text-[10px] sm:text-xs text-emerald-400 font-black uppercase tracking-[0.3em]">Custo Total Estimado</span>
                <div className="relative text-5xl sm:text-7xl font-black text-white mt-4 tracking-tighter transition-transform group-hover:scale-105 duration-500">
                  {formatCentsToBRL(calculateTotal())}
                </div>
                <div className="relative mt-8 flex items-center justify-center gap-6 text-gray-500 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em]">
                  <span className="flex items-center gap-2"><Package size={14} /> {selectedItems.length} Itens</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                  <span className="flex items-center gap-2"><ArrowRight size={14} /> {entryType === 'propria' ? 'Acerto Direto' : supplier}</span>
                </div>
              </div>

              {/* Destination Options */}
              <div className="space-y-6">
                <label className={labelClass + " text-center"}>Para onde vai essa mercadoria?</label>
                
                <div className="flex flex-col gap-4">
                  {/* Central Deposit */}
                  <button 
                    disabled={loading}
                    onClick={() => handleFinalize("deposito")}
                    className="group bg-white/[0.03] border-2 border-white/5 hover:border-emerald-500/50 p-6 sm:p-8 rounded-[2.5rem] flex items-center justify-between transition-all active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/5 rounded-3xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-black transition-all group-hover:rotate-3 shadow-xl">
                        <Warehouse size={28} />
                      </div>
                      <div className="text-left">
                        <span className="text-base sm:text-xl font-black text-white block">Estoque Central</span>
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1 block">Aumentar saldo do depósito principal</span>
                      </div>
                    </div>
                    <ArrowRight className="text-gray-700 group-hover:text-white group-hover:translate-x-2 transition-all" size={24} />
                  </button>

                  <div className="py-4 flex items-center gap-4">
                    <div className="h-px bg-white/5 flex-1" />
                    <span className="text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">Ou entregar para</span>
                    <div className="h-px bg-white/5 flex-1" />
                  </div>

                  {/* Sellers Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {employees.map(seller => (
                      <button 
                        key={seller.id}
                        disabled={loading}
                        onClick={() => handleFinalize("vendedor", seller.id)}
                        className="group bg-white/[0.03] border-2 border-white/5 hover:border-purple-500/50 p-5 rounded-[2rem] flex items-center gap-4 transition-all active:scale-95 text-left"
                      >
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-all shadow-lg group-hover:-rotate-3">
                          <User size={20} className="text-gray-500 group-hover:text-white" />
                        </div>
                        <div>
                          <span className="text-sm font-black text-white block truncate max-w-[150px]">{seller.name}</span>
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Vendedor: {seller.appCode || 'S/COD'}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Fixed Navigation Footer */}
        <footer className="px-6 py-6 sm:p-8 border-t border-white/5 bg-[#0f0f0f]/90 backdrop-blur-xl flex items-center justify-between shrink-0 relative z-20">
          <button 
            type="button"
            onClick={step === 1 ? handleCancelClick : () => setStep(step - 1)}
            className="flex items-center gap-2 py-4 px-6 text-[10px] font-black text-gray-500 hover:text-white uppercase tracking-widest transition-all active:scale-90"
          >
            {step === 1 ? 'Sair' : <><ChevronLeft size={18} /> Voltar</>}
          </button>

          <div className="hidden sm:block">
            {step === 2 && (
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Total Previsto</span>
                <span className="text-xl font-black text-emerald-400 leading-none mt-1">{formatCentsToBRL(calculateTotal())}</span>
              </div>
            )}
          </div>

          {step < 3 ? (
            <button 
              disabled={step === 2 && selectedItems.length === 0}
              onClick={() => setStep(step + 1)}
              className="group bg-white text-black py-4 px-10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 hover:bg-emerald-400 transition-all active:scale-95 disabled:opacity-30 disabled:grayscale shadow-xl shadow-white/5"
            >
              Prosseguir
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <div className="text-[9px] text-emerald-500/50 font-black uppercase tracking-[0.3em] animate-pulse pr-4">
              Escolha o Destino
            </div>
          )}
        </footer>
      </div>

      {/* Confirmation Modal for Cancel */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md animate-in fade-in" onClick={() => setShowCancelConfirm(false)} />
          <div className="relative bg-[#1a1a1a] border border-white/10 p-8 sm:p-10 rounded-[2.5rem] max-w-sm w-full text-center space-y-8 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto border-2 border-red-500/20 shadow-2xl shadow-red-500/10">
              <AlertCircle size={40} className="text-red-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-white">Descartar Entrada?</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Você adicionou <span className="text-white font-bold">{selectedItems.length} itens</span>. Todo o progresso será perdido se sair agora.</p>
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setShowCancelConfirm(false)}
                className="py-4 px-4 bg-white/5 border border-white/5 text-[10px] font-black text-white uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-all active:scale-95"
              >
                Continuar Editando
              </button>
              <button 
                onClick={() => {
                  setShowCancelConfirm(false);
                  onClose();
                  reset();
                }}
                className="py-4 px-4 bg-red-500 text-[10px] font-black text-white uppercase tracking-widest rounded-2xl hover:bg-red-600 transition-all shadow-xl shadow-red-500/20 active:scale-95"
              >
                Sim, Descartar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
