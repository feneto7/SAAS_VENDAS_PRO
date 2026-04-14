"use client";

import { useState, useEffect } from "react";
import { X, FileText, Save, Loader2, User, Map, Package, Plus, Trash2, ArrowRight, DollarSign, Calculator } from "lucide-react";
import { CustomSelect } from "@/components/dashboard/shared/CustomSelect";
import { formatCentsToBRL, parseBRLToCents, applyCurrencyMask } from "@/utils/money";
import { useIsMobile } from "@/hooks/useIsMobile";

interface NewFichaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tenantSlug: string;
}

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001";

export function NewFichaModal({ isOpen, onClose, onSuccess, tenantSlug }: NewFichaModalProps) {
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    routeId: "",
    clientId: "",
    sellerId: "",
    notes: "",
    items: [{ productId: "", quantity: 1, unitPrice: 0, type: "SC" as "CC" | "SC" }]
  });

  useEffect(() => {
    if (isOpen) {
      const headers = { "x-tenant-slug": tenantSlug };
      
      Promise.all([
        fetch(`${SERVER_URL}/api/routes?limit=1000`, { headers }).then(r => r.json()),
        fetch(`${SERVER_URL}/api/clients?limit=1000`, { headers }).then(r => r.json()),
        fetch(`${SERVER_URL}/api/employees?limit=1000`, { headers }).then(r => r.json()),
        fetch(`${SERVER_URL}/api/products?limit=1000`, { headers }).then(r => r.json())
      ]).then(([routesData, clientsData, sellersData, productsData]) => {
        setRoutes(routesData.items || []);
        setClients(clientsData.items || []);
        setSellers(sellersData.items || []);
        setProducts(productsData.items || []);
      }).catch(err => console.error("Error fetching data for modal:", err));
    }
  }, [isOpen, tenantSlug]);

  const filteredClients = formData.routeId 
    ? clients.filter(c => c.routeId === formData.routeId)
    : [];

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: "", quantity: 1, unitPrice: 0, type: "SC" }]
    });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === "productId" || field === "type") {
      const product = products.find(p => p.id === newItems[index].productId);
      if (product) {
        newItems[index].unitPrice = newItems[index].type === "CC" 
          ? Number(product.priceCC) || 0 
          : Number(product.priceSC) || 0;
      }
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const totals = formData.items.reduce((acc, item) => {
    const amount = (item.quantity || 0) * (item.unitPrice || 0);
    if (item.type === "CC") acc.totalCC += amount;
    else acc.totalSC += amount;
    acc.grandTotal += amount;
    return acc;
  }, { totalCC: 0, totalSC: 0, grandTotal: 0 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.routeId || !formData.clientId || !formData.sellerId || formData.items.some(i => !i.productId)) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      setLoading(true);
      const payload = { ...formData, total: totals.grandTotal };

      const res = await fetch(`${SERVER_URL}/api/fichas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-slug": tenantSlug
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const errorData = await res.json();
        alert(`Erro ao salvar ficha: ${errorData.error || "Tente novamente"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const sectionLabel = "text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-6 sm:mb-8";
  const inputLabel = "text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2 block";
  const inputClass = "w-full bg-white/[0.04] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:border-emerald-500 focus:bg-white/[0.08] outline-none transition-all placeholder:text-gray-700";

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/95 backdrop-blur-xl animate-in fade-in duration-500" 
        onClick={onClose} 
      />

      {/* Modal Container */}
      <div className="relative w-full h-[98vh] sm:h-[90vh] sm:max-w-6xl bg-[#0c0c0c] border-t sm:border border-white/10 rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-500 ease-out">
        
        {/* Mobile Handle */}
        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-4 mb-2 sm:hidden shrink-0" />

        {/* Header */}
        <header className="px-6 py-4 sm:p-8 border-b border-white/5 flex items-center justify-between shrink-0 bg-gradient-to-r from-emerald-500/5 to-transparent">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 sm:w-14 sm:h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
              <FileText className="text-emerald-400" size={isMobile ? 20 : 28} />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight leading-none">Nova Ficha</h2>
              <p className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-widest mt-2 opacity-70 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Processamento em Tempo Real
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 sm:p-3 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-all active:scale-90">
            <X size={24} />
          </button>
        </header>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
          <div className="max-w-5xl mx-auto space-y-12">
            
            {/* Context Section */}
            <section>
              <h3 className={sectionLabel}><User size={14} /> Atendimento</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 bg-white/[0.02] border border-white/5 p-6 sm:p-8 rounded-[2.5rem]">
                <div className="space-y-1.5">
                  <label className={inputLabel}>Selecione a Rota</label>
                  <CustomSelect
                    options={[
                      { value: "", label: "Qual a rota?" },
                      ...routes.map(r => ({ value: r.id, label: `${r.name} (${String(r.code).padStart(3, '0')})` }))
                    ]}
                    value={formData.routeId}
                    onChange={val => setFormData({ ...formData, routeId: val, clientId: "" })}
                  />
                </div>
                <div className={`space-y-1.5 transition-all ${!formData.routeId ? "opacity-30 pointer-events-none grayscale" : ""}`}>
                  <label className={inputLabel}>Escolha o Cliente</label>
                  <CustomSelect
                    options={[
                      { value: "", label: "Quem é o cliente?" },
                      ...filteredClients.map(c => ({ value: c.id, label: c.name }))
                    ]}
                    value={formData.clientId}
                    onChange={val => setFormData({ ...formData, clientId: val })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={inputLabel}>Vendedor</label>
                  <CustomSelect
                    options={[
                      { value: "", label: "Quem está vendendo?" },
                      ...sellers.map(s => ({ value: s.id, label: s.name }))
                    ]}
                    value={formData.sellerId}
                    onChange={val => setFormData({ ...formData, sellerId: val })}
                  />
                </div>
              </div>
            </section>

            {/* Items Section */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h3 className={sectionLabel}><Package size={14} /> Itens da Ficha</h3>
                <span className="text-[10px] font-black text-gray-600 bg-white/5 px-3 py-1 rounded-full">{formData.items.length} itens</span>
              </div>
              
              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <div key={index} className="relative bg-white/[0.03] border border-white/10 rounded-[2rem] p-5 sm:p-8 hover:bg-white/[0.06] transition-all group animate-in zoom-in-95 duration-300">
                    
                    {/* Delete Item Button */}
                    {formData.items.length > 1 && (
                      <button 
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="absolute -top-2 -right-2 w-8 h-8 sm:w-10 sm:h-10 bg-red-500 text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-90 transition-all z-20"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
                      
                      {/* Product Selector */}
                      <div className="lg:col-span-1 text-center">
                        <label className={inputLabel}>Tipo</label>
                        <button
                          type="button"
                          onClick={() => handleItemChange(index, "type", item.type === "CC" ? "SC" : "CC")}
                          className={`w-full h-[54px] rounded-2xl font-black text-[10px] transition-all border-2 flex items-center justify-center gap-2 ${
                            item.type === "CC" 
                              ? "bg-purple-600/20 border-purple-500 text-purple-400 shadow-lg shadow-purple-500/10" 
                              : "bg-white/5 border-white/10 text-gray-500"
                          }`}
                        >
                          {item.type}
                        </button>
                      </div>

                      <div className="lg:col-span-5">
                        <label className={inputLabel}>Produto</label>
                        <CustomSelect
                          options={[
                            { value: "", label: "Selecione o produto..." },
                            ...products.map(p => ({ value: p.id, label: p.name }))
                          ]}
                          value={item.productId}
                          onChange={val => handleItemChange(index, "productId", val)}
                        />
                      </div>

                      <div className="grid grid-cols-2 lg:col-span-6 gap-4">
                        <div className="space-y-1.5">
                          <label className={inputLabel}>Quantidade</label>
                          <div className="flex items-center bg-black/40 rounded-2xl border border-white/10 overflow-hidden">
                            <button 
                              type="button" 
                              onClick={() => handleItemChange(index, "quantity", Math.max(1, item.quantity - 1))}
                              className="px-4 py-3 hover:bg-white/5 transition-colors text-gray-400"
                            >-</button>
                            <input 
                              type="number"
                              className="w-full bg-transparent text-center text-sm font-black text-white outline-none"
                              value={item.quantity}
                              onChange={e => handleItemChange(index, "quantity", parseInt(e.target.value) || 1)}
                            />
                            <button 
                              type="button" 
                              onClick={() => handleItemChange(index, "quantity", item.quantity + 1)}
                              className="px-4 py-3 hover:bg-white/5 transition-colors text-gray-400"
                            >+</button>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className={inputLabel}>Preço ({item.type})</label>
                          <div className="relative">
                            <span className="absolute left-4 top-4 text-[10px] text-gray-500 font-black">R$</span>
                            <input 
                              type="text"
                              className="w-full bg-black/40 border border-white/10 rounded-2xl pl-10 pr-4 py-4 text-sm font-black text-white outline-none focus:border-emerald-500 transition-all"
                              value={applyCurrencyMask(String(item.unitPrice))}
                              onChange={e => handleItemChange(index, "unitPrice", parseBRLToCents(e.target.value))}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <button 
                  type="button"
                  onClick={handleAddItem}
                  className="w-full py-6 sm:py-10 border-2 border-dashed border-white/5 rounded-[2rem] text-[10px] uppercase tracking-[0.3em] font-black text-gray-600 hover:border-emerald-500/50 hover:text-emerald-400 hover:bg-emerald-500/5 transition-all flex flex-col items-center justify-center gap-4 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-black transition-all">
                    <Plus size={24} />
                  </div>
                  <span>Adicionar outro produto</span>
                </button>
              </div>
            </section>

            {/* Notes Section */}
            <section>
              <h3 className={sectionLabel}><Calculator size={14} /> Observações</h3>
              <textarea 
                className={`${inputClass} min-h-[150px] resize-none px-8 py-6 rounded-[2.5rem]`}
                placeholder="Existem observações importantes para essa venda?"
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
              />
            </section>
          </div>
        </form>

        {/* Floating/Fixed Footer */}
        <footer className="relative p-6 sm:p-8 border-t border-white/5 bg-[#0f0f0f]/90 backdrop-blur-2xl flex flex-col sm:flex-row gap-6 items-stretch sm:items-center shadow-2xl z-20 shrink-0">
          
          <div className="flex-1 flex gap-6 sm:gap-12 items-center justify-between sm:justify-start">
            <div className="space-y-1">
              <p className="text-[8px] sm:text-[9px] text-gray-600 font-black uppercase tracking-widest pl-1">Total da Venda</p>
              <p className="text-2xl sm:text-4xl font-black text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)] tracking-tighter leading-none">
                {formatCentsToBRL(totals.grandTotal)}
              </p>
            </div>
            
            <div className="hidden sm:flex items-center gap-8">
              <div className="h-10 w-px bg-white/5" />
              <div>
                <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">Total (CC)</p>
                <p className="text-sm font-bold text-purple-400">{formatCentsToBRL(totals.totalCC)}</p>
              </div>
              <div>
                <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">Total (SC)</p>
                <p className="text-sm font-bold text-gray-300">{formatCentsToBRL(totals.totalSC)}</p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 sm:gap-4 shrink-0">
            <button 
              type="button" 
              onClick={onClose}
              disabled={loading}
              className="flex-1 sm:flex-none px-6 sm:px-10 py-4 sm:py-6 text-[10px] font-black text-gray-500 hover:text-white transition-all bg-white/[0.03] hover:bg-white/10 rounded-2xl border border-white/5 uppercase tracking-widest active:scale-95"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="flex-[2] sm:flex-none px-10 sm:px-16 py-4 sm:py-6 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-emerald-400 transition-all active:scale-95 disabled:opacity-50 shadow-2xl shadow-white/5"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : (
                <>
                  <Save size={18} />
                  Emitir Ficha
                </>
              )}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
