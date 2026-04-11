"use client";

import { useState, useEffect } from "react";
import { X, FileText, Save, Loader2, User, Map, Package, Plus, Trash2 } from "lucide-react";
import { CustomSelect } from "@/components/dashboard/shared/CustomSelect";
import { formatCentsToBRL, parseBRLToCents, applyCurrencyMask } from "@/utils/money";

interface NewFichaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tenantSlug: string;
}

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001";

export function NewFichaModal({ isOpen, onClose, onSuccess, tenantSlug }: NewFichaModalProps) {
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
      // Fetch necessary data
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

  // Filter clients by selected route
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
    
    // Update price based on type (CC/SC)
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
    const amount = item.quantity * item.unitPrice;
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
      
      const payload = {
        ...formData,
        total: totals.grandTotal
      };

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
        alert(`Erro ao salvar ficha: ${errorData.error || "Tente novamente"}${errorData.details ? ` (${errorData.details})` : ""}`);
      }
    } catch (err) {
      console.error(err);
      alert("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const sectionLabel = "text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-6";
  const inputLabel = "text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2 block";
  const inputClass = "w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white focus:border-emerald-500 focus:bg-white/[0.06] outline-none transition-all placeholder:text-gray-700";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />

      <div className="relative w-full h-full bg-[#0c0c0c] border-l border-white/10 flex flex-col overflow-hidden animate-in slide-in-from-right duration-500">
        
        {/* Header */}
        <header className="p-8 border-b border-white/5 flex items-center justify-between shrink-0 bg-gradient-to-r from-emerald-500/10 to-transparent">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
              <FileText className="text-emerald-400" size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Nova Ficha de Venda</h2>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-[0.2em] mt-1 opacity-70">Painel de Lançamento em Tempo Real</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-2xl text-gray-500 hover:text-white transition-all active:scale-90 border border-transparent hover:border-white/10">
            <X size={28} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-12 custom-scrollbar">
          <div className="max-w-6xl mx-auto space-y-12">
            
            {/* Header Info */}
            <section className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8">
              <h3 className={sectionLabel}><User size={14} /> Atendimento e Logística</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <label className={inputLabel}>1. Selecione a Rota</label>
                  <CustomSelect
                    options={[
                      { value: "", label: "Selecione a rota..." },
                      ...routes.map(r => ({ value: r.id, label: `${r.name} (Cód: ${String(r.code).padStart(3, '0')})` }))
                    ]}
                    value={formData.routeId}
                    onChange={val => {
                      setFormData({ ...formData, routeId: val, clientId: "" }); // Reset client when route changes
                    }}
                  />
                </div>
                <div className={!formData.routeId ? "opacity-50 pointer-events-none" : ""}>
                  <label className={inputLabel}>2. Selecione o Cliente</label>
                  <CustomSelect
                    options={[
                      { value: "", label: formData.routeId ? "Selecione o cliente..." : "Selecione a rota primeiro" },
                      ...filteredClients.map(c => ({ value: c.id, label: `${c.name} (${c.city || 'Sem cidade'})` }))
                    ]}
                    value={formData.clientId}
                    onChange={val => setFormData({ ...formData, clientId: val })}
                  />
                </div>
                <div>
                  <label className={inputLabel}>3. Vendedor Responsável</label>
                  <CustomSelect
                    options={[
                      { value: "", label: "Selecione o vendedor..." },
                      ...sellers.map(s => ({ value: s.id, label: s.name }))
                    ]}
                    value={formData.sellerId}
                    onChange={val => setFormData({ ...formData, sellerId: val })}
                  />
                </div>
              </div>
            </section>

            {/* Items */}
            <section className="bg-white/[0.01] border border-white/5 rounded-[2rem] p-8">
              <h3 className={sectionLabel}><Package size={14} /> Itens da Venda</h3>
              <div className="space-y-6">
                {formData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end bg-white/[0.02] p-6 rounded-[1.5rem] border border-white/5 hover:bg-white/[0.04] transition-all group">
                    <div className="md:col-span-1">
                      <label className={inputLabel}>Tipo</label>
                      <button
                        type="button"
                        onClick={() => handleItemChange(index, "type", item.type === "CC" ? "SC" : "CC")}
                        className={`w-full h-[50px] rounded-xl font-black text-[10px] transition-all border ${
                          item.type === "CC" 
                            ? "bg-purple-500/20 border-purple-500/40 text-purple-400" 
                            : "bg-white/5 border-white/10 text-gray-500"
                        }`}
                      >
                        {item.type}
                      </button>
                    </div>
                    <div className="md:col-span-5">
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
                    <div className="md:col-span-2">
                      <label className={inputLabel}>Qtd</label>
                      <input 
                        type="number"
                        min="1"
                        className={inputClass}
                        value={item.quantity}
                        onChange={e => handleItemChange(index, "quantity", parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className={inputLabel}>Preço Unit. ({item.type})</label>
                      <div className="relative">
                        <span className={`absolute left-4 top-3.5 text-sm font-bold ${item.type === 'CC' ? 'text-purple-400' : 'text-gray-500'}`}>R$</span>
                        <input 
                          type="text"
                          className={`${inputClass} pl-10 border-dashed focus:border-solid ${item.type === 'CC' ? 'text-purple-400' : 'text-emerald-400'}`}
                          value={applyCurrencyMask(String(item.unitPrice))}
                          onChange={e => handleItemChange(index, "unitPrice", parseBRLToCents(e.target.value))}
                        />
                      </div>
                    </div>
                    <div className="md:col-span-1">
                      <button 
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="w-full h-[50px] flex items-center justify-center text-red-500/40 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}
                <button 
                  type="button"
                  onClick={handleAddItem}
                  className="w-full py-6 border-2 border-dashed border-white/5 rounded-2xl text-[10px] uppercase tracking-[0.2em] font-black text-gray-500 hover:border-emerald-500/30 hover:text-emerald-400 hover:bg-emerald-500/5 transition-all flex items-center justify-center gap-3"
                >
                  <Plus size={16} />
                  Adicionar outro produto à ficha
                </button>
              </div>
            </section>

            {/* Notes */}
            <section className="bg-white/[0.01] border border-white/5 rounded-[2rem] p-8">
              <h3 className={sectionLabel}><FileText size={14} /> Observações Adicionais</h3>
              <textarea 
                className={`${inputClass} min-h-[120px] resize-none p-6 text-base`}
                placeholder="Ex: Cliente solicitou entrega para o período da tarde..."
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
              />
            </section>


          </div>
        </form>

        <footer className="p-8 border-t border-white/5 bg-black/40 backdrop-blur-xl flex items-center gap-8">
          <div className="flex-1 flex gap-12">
            <div>
              <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Total Com Comissão (CC)</p>
              <p className="text-xl font-bold text-purple-400">{formatCentsToBRL(totals.totalCC)}</p>
            </div>
            <div className="w-px h-10 bg-white/5" />
            <div>
              <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Total Sem Comissão (SC)</p>
              <p className="text-xl font-bold text-gray-300">{formatCentsToBRL(totals.totalSC)}</p>
            </div>
            <div className="w-px h-10 bg-white/5 hidden md:block" />
            <div className="ml-auto text-right">
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Total da Ficha</p>
              <p className="text-3xl font-black text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                {formatCentsToBRL(totals.grandTotal)}
              </p>
            </div>
          </div>
          
          <div className="flex gap-4 shrink-0">
            <button 
              type="button" 
              onClick={onClose}
              className="px-8 py-5 text-xs font-black text-gray-400 hover:text-white transition-all bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="px-12 py-5 bg-white text-black rounded-2xl text-xs font-black flex items-center justify-center gap-3 hover:bg-emerald-400 transition-all active:scale-95 disabled:opacity-50 shadow-2xl shadow-emerald-500/20"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              Finalizar e Salvar Ficha
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
