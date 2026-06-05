"use client";

import { useState, useEffect, useRef } from "react";
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
  
  const [formData, setFormData] = useState<{
    routeId: string;
    clientId: string;
    sellerId: string;
    notes: string;
    items: Array<{ productId: string; quantity: number; unitPrice: number; type: "CC" | "SC" | "BRINDE" }>;
  }>({
    routeId: "",
    clientId: "",
    sellerId: "",
    notes: "",
    items: []
  });

  const [draftItem, setDraftItem] = useState<{
    productId: string;
    quantity: number | string;
    unitPrice: number;
    type: "CC" | "SC" | "BRINDE";
  }>({
    productId: "",
    quantity: 1,
    unitPrice: 0,
    type: "SC"
  });

  const quantityRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);

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

  const handleRemoveItem = (index: number) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({ ...formData, items: newItems });
  };

  const handleDraftChange = (field: string, value: any) => {
    const newItem = { ...draftItem, [field]: value };
    
    if (field === "productId" || field === "type") {
      const product = products.find(p => p.id === newItem.productId);
      if (product) {
        newItem.unitPrice = newItem.type === "CC" 
          ? Number(product.priceCC) || 0 
          : Number(product.priceSC) || 0;
      }
    }
    
    setDraftItem(newItem);
  };

  const handleAddDraftItem = () => {
    const qty = Number(draftItem.quantity);
    if (!draftItem.productId || isNaN(qty) || qty <= 0) return;
    
    const finalType = draftItem.unitPrice === 0 ? "BRINDE" : draftItem.type;
    
    setFormData({
      ...formData,
      items: [...formData.items, { ...draftItem, quantity: qty, type: finalType }]
    });
    setDraftItem({
      productId: "",
      quantity: 1,
      unitPrice: 0,
      type: "SC"
    });
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

      const res = await fetch(`${SERVER_URL}/api/cards`, {
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
        alert(`Erro ao salvar card: ${errorData.error || "Tente novamente"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const sectionLabel = "nm-heading flex items-center gap-2 mb-6 sm:mb-8";
  const inputLabel = "nm-input-group__label mb-1";
  const inputClass = "nm-input";

  return (
    <div className="nm-modal-backdrop" onClick={onClose}>
      <div className="nm-modal nm-modal--xl" onClick={(e) => e.stopPropagation()}>

        <header className="nm-modal__header">
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div className="nm-icon-circle nm-icon-circle--success nm-icon-circle--lg">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="nm-modal__title">Nova Ficha</h2>
              <p className="nm-modal__subtitle flex items-center gap-2" style={{ textTransform: "uppercase", fontWeight: "bold", fontSize: "10px" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Processamento em Tempo Real
              </p>
            </div>
          </div>
          <button onClick={onClose} className="nm-modal__close">
            <X size={18} />
          </button>
        </header>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="nm-modal__body custom-scrollbar">
          <div className="max-w-5xl mx-auto space-y-12">
            
            {/* Context Section */}
            <section className="relative z-30">
              <h3 className={sectionLabel}><User size={14} /> Atendimento</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 nm-card nm-card--sm p-6 sm:p-8">
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
            <section className="relative z-20">
              <div className="flex items-center justify-between mb-6">
                <h3 className={sectionLabel}><Package size={14} /> Lançamento Rápido</h3>
                <span className="text-[10px] font-black text-gray-600 bg-white/5 px-3 py-1 rounded-full">{formData.items.length} itens</span>
              </div>
              
              <div className="space-y-6">
                {/* Draft Item Form */}
                <div className="nm-card nm-card--sm p-5 sm:p-6" style={{ zIndex: 50 }}>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                    
                    {/* Tipo */}
                    <div className="lg:col-span-2 text-center">
                      <label className={inputLabel}>Tipo</label>
                      <button
                        type="button"
                        onClick={() => handleDraftChange("type", draftItem.type === "CC" ? "SC" : "CC")}
                        className={`w-full nm-input flex items-center justify-center gap-2 transition-all ${
                          draftItem.type === "CC" 
                            ? "text-purple-400 border-purple-500/30" 
                            : "text-gray-500 hover:text-white"
                        }`}
                        style={{ fontWeight: "bold" }}
                      >
                        {draftItem.type}
                      </button>
                    </div>

                    {/* Product Selector */}
                    <div className="lg:col-span-4 relative" style={{ zIndex: 100 }}>
                      <label className={inputLabel}>Produto</label>
                      <CustomSelect
                        options={[
                          { value: "", label: "Busque e selecione o produto..." },
                          ...products.map(p => ({ value: p.id, label: p.name }))
                        ]}
                        value={draftItem.productId}
                        onChange={val => {
                          handleDraftChange("productId", val);
                          setTimeout(() => {
                            quantityRef.current?.focus();
                            quantityRef.current?.select();
                          }, 50);
                        }}
                      />
                    </div>

                    {/* Quantidade */}
                    <div className="lg:col-span-2">
                      <label className={inputLabel}>Quantidade</label>
                      <div className="flex items-center nm-input overflow-hidden" style={{ padding: "0 0.25rem" }}>
                        <button 
                          type="button" 
                          onClick={() => handleDraftChange("quantity", Math.max(1, Number(draftItem.quantity) - 1))}
                          className="w-8 shrink-0 hover:bg-white/5 transition-colors text-gray-400 flex items-center justify-center rounded-sm"
                          style={{ minHeight: "100%", alignSelf: "stretch" }}
                        >-</button>
                        <input 
                          ref={quantityRef}
                          type="number"
                          className="w-full bg-transparent text-center text-sm font-black text-white outline-none focus-visible:outline-none"
                          style={{ padding: "0.4rem 0" }}
                          value={draftItem.quantity}
                          onChange={e => {
                            const val = e.target.value;
                            handleDraftChange("quantity", val === "" ? "" : parseInt(val) || 0);
                          }}
                          onKeyDown={e => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              priceRef.current?.focus();
                              priceRef.current?.select();
                            }
                          }}
                        />
                        <button 
                          type="button" 
                          onClick={() => handleDraftChange("quantity", Number(draftItem.quantity) + 1)}
                          className="w-8 shrink-0 hover:bg-white/5 transition-colors text-gray-400 flex items-center justify-center rounded-sm"
                          style={{ minHeight: "100%", alignSelf: "stretch" }}
                        >+</button>
                      </div>
                    </div>

                    {/* Preço */}
                    <div className="lg:col-span-2">
                      <label className={inputLabel}>Preço ({draftItem.type})</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] nm-text-muted font-bold">R$</span>
                        <input 
                          ref={priceRef}
                          type="text"
                          className="nm-input"
                          style={{ paddingLeft: "2rem" }}
                          value={applyCurrencyMask(String(draftItem.unitPrice))}
                          onChange={e => handleDraftChange("unitPrice", parseBRLToCents(e.target.value))}
                          onKeyDown={e => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddDraftItem();
                            }
                          }}
                        />
                      </div>
                    </div>

                    {/* Add Button */}
                    <div className="lg:col-span-2 flex items-end">
                      <button 
                        type="button"
                        onClick={handleAddDraftItem}
                        disabled={!draftItem.productId || Number(draftItem.quantity) <= 0}
                        className="w-full nm-btn nm-btn--sm nm-btn--accent flex items-center justify-center"
                        style={{ height: "calc(1.5rem + 0.8rem + 2px)", padding: "0" }}
                      >
                        <Plus size={16} className="mr-1" />
                        Adicionar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Table of added items */}
                {formData.items.length > 0 && (
                  <div className="nm-table-wrapper nm-animate-fade-in">
                    <div className="nm-table-scroll">
                      <table className="nm-table">
                        <thead>
                          <tr>
                            <th style={{ width: "60px", textAlign: "center" }}>Tipo</th>
                            <th>Produto</th>
                            <th style={{ textAlign: "center", width: "100px" }}>Qtd</th>
                            <th style={{ textAlign: "right", width: "140px" }}>Preço Unit.</th>
                            <th style={{ textAlign: "right", width: "140px" }}>Subtotal</th>
                            <th style={{ textAlign: "right", width: "80px" }}>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formData.items.map((item, index) => {
                            const p = products.find(prod => prod.id === item.productId);
                            const subtotal = item.quantity * item.unitPrice;
                            return (
                              <tr key={index}>
                                <td style={{ textAlign: "center" }}>
                                  <span className={`nm-code ${
                                    item.type === "CC" ? "text-purple-400 border-purple-500/30" : 
                                    item.type === "BRINDE" ? "text-amber-400 border-amber-500/30" :
                                    "text-gray-400"
                                  }`} style={{ padding: "0.2rem 0.4rem", fontSize: "10px", fontWeight: "bold" }}>
                                    {item.type}
                                  </span>
                                </td>
                                <td>
                                  <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                                    <span style={{ fontWeight: 600, color: "var(--nm-text-primary)" }}>{p ? p.name : "..."}</span>
                                  </div>
                                </td>
                                <td style={{ textAlign: "center" }}>
                                  <span style={{ fontWeight: 800 }}>{item.quantity}</span>
                                </td>
                                <td style={{ textAlign: "right" }}>{formatCentsToBRL(item.unitPrice)}</td>
                                <td style={{ textAlign: "right", fontWeight: 800, color: "var(--nm-text-primary)" }}>{formatCentsToBRL(subtotal)}</td>
                                <td className="nm-actions-col">
                                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                    <button 
                                      type="button"
                                      className="nm-btn nm-btn--circle nm-btn--xs nm-btn--danger"
                                      onClick={() => handleRemoveItem(index)}
                                      title="Remover Item"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Notes Section */}
            <section className="relative z-10">
              <h3 className={sectionLabel}><Calculator size={14} /> Observações</h3>
              <textarea 
                className={`${inputClass} nm-textarea`}
                style={{ minHeight: "150px" }}
                placeholder="Existem observações importantes para essa venda?"
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
              />
            </section>
          </div>
        </form>

        {/* Floating/Fixed Footer */}
        <footer className="nm-modal__footer">
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
              className="nm-btn nm-btn--flat"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="nm-btn nm-btn--accent"
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
