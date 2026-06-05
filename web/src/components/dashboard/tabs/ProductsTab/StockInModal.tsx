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
    <div className="nm-modal-backdrop" onClick={handleCancelClick}>
      <div 
        className="nm-modal nm-modal--xl"
        onClick={(e) => e.stopPropagation()}
        style={{ margin: "auto", height: "90vh", display: "flex", flexDirection: "column" }}
      >
        {/* Header */}
        <header className="nm-modal__header" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: "3.5rem", height: "3.5rem", borderRadius: "var(--nm-radius-md)", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--nm-surface-deep)", boxShadow: "var(--nm-shadow-inset)", color: "var(--nm-success)" }}>
              <Download size={24} />
            </div>
            <div>
              <h2 className="nm-modal__title">Entrada</h2>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                {[1, 2, 3].map((s) => (
                  <div key={s} style={{ height: "4px", borderRadius: "2px", transition: "all 0.5s", width: s === step ? "2rem" : "0.5rem", background: s === step ? "var(--nm-success)" : "var(--nm-border)" }} />
                ))}
                <span style={{ marginLeft: "0.5rem", fontSize: "10px", color: "var(--nm-text-muted)", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.2em" }}>Passo {step}</span>
              </div>
            </div>
          </div>
          <button onClick={handleCancelClick} className="nm-modal__close">
            <X size={20} />
          </button>
        </header>

        {/* Content Body */}
        <div className="nm-modal__body custom-scrollbar" style={{ flex: 1, padding: "1.5rem", display: "flex", flexDirection: "column" }}>
          
          {/* STEP 1 */}
          {step === 1 && (
            <div style={{ maxWidth: "600px", margin: "0 auto", padding: "1rem 0", width: "100%" }}>
              <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                <h3 style={{ fontSize: "1.5rem", fontWeight: "900", color: "var(--nm-text-primary)", marginBottom: "0.5rem" }}>Como esta carga chegou?</h3>
                <p style={{ fontSize: "var(--nm-text-sm)", color: "var(--nm-text-secondary)" }}>Selecione a origem para começar a registrar os itens.</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
                <button 
                  onClick={() => setEntryType("propria")}
                  style={{
                    padding: "1.5rem",
                    borderRadius: "var(--nm-radius-lg)",
                    border: entryType === 'propria' ? '1px solid var(--nm-success)' : '1px solid var(--nm-border)',
                    background: entryType === 'propria' ? 'var(--nm-surface-raised)' : 'var(--nm-surface)',
                    boxShadow: entryType === 'propria' ? 'var(--nm-shadow-glow)' : 'var(--nm-shadow-flat)',
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "1rem",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  <div style={{ width: "3rem", height: "3rem", borderRadius: "1rem", display: "flex", alignItems: "center", justifyContent: "center", background: entryType === 'propria' ? 'var(--nm-success)' : 'var(--nm-surface-deep)', color: entryType === 'propria' ? '#fff' : 'var(--nm-text-muted)', transform: entryType === 'propria' ? 'rotate(3deg)' : 'none', transition: "all 0.3s" }}>
                    <Warehouse size={24} />
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <span style={{ fontSize: "1rem", fontWeight: "900", color: entryType === 'propria' ? 'var(--nm-text-primary)' : 'var(--nm-text-secondary)', display: "block" }}>Entrada Própria</span>
                    <span style={{ fontSize: "9px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--nm-text-muted)" }}>Direto do estoque</span>
                  </div>
                </button>

                <button 
                  onClick={() => setEntryType("fornecedor")}
                  style={{
                    padding: "1.5rem",
                    borderRadius: "var(--nm-radius-lg)",
                    border: entryType === 'fornecedor' ? '1px solid var(--nm-accent)' : '1px solid var(--nm-border)',
                    background: entryType === 'fornecedor' ? 'var(--nm-surface-raised)' : 'var(--nm-surface)',
                    boxShadow: entryType === 'fornecedor' ? 'var(--nm-shadow-glow)' : 'var(--nm-shadow-flat)',
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "1rem",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  <div style={{ width: "3rem", height: "3rem", borderRadius: "1rem", display: "flex", alignItems: "center", justifyContent: "center", background: entryType === 'fornecedor' ? 'var(--nm-accent)' : 'var(--nm-surface-deep)', color: entryType === 'fornecedor' ? '#fff' : 'var(--nm-text-muted)', transform: entryType === 'fornecedor' ? 'rotate(-3deg)' : 'none', transition: "all 0.3s" }}>
                    <Package size={24} />
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <span style={{ fontSize: "1rem", fontWeight: "900", color: entryType === 'fornecedor' ? 'var(--nm-text-primary)' : 'var(--nm-text-secondary)', display: "block" }}>Fornecedor</span>
                    <span style={{ fontSize: "9px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--nm-text-muted)" }}>Compra externa</span>
                  </div>
                </button>
              </div>

              {entryType === "fornecedor" && (
                <div className="nm-input-group" style={{ maxWidth: "400px", margin: "0 auto" }}>
                  <label className="nm-input-group__label">Nome do Fornecedor</label>
                  <input 
                    className="nm-input nm-input--raised"
                    placeholder="Ex: Distribuidora Central"
                    value={supplier}
                    onChange={e => setSupplier(e.target.value)}
                    autoFocus
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", height: "100%" }}>
              <div className="nm-input-group">
                <div className="nm-input-group--with-icon">
                  <div className="nm-input-group__icon">
                    <Search size={18} />
                  </div>
                  <input 
                    className="nm-input nm-input--search nm-input--raised"
                    placeholder="Buscar por nome, SKU ou categoria..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "2rem", flex: 1, minHeight: 0 }}>
                {/* Catalog */}
                <div style={{ display: (isMobile && activeMobileTab !== 'catalog') ? 'none' : 'flex', flexDirection: "column", gap: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "var(--nm-text-sm)", fontWeight: "900", color: "var(--nm-text-primary)" }}>Catálogo de Produtos</span>
                    <span style={{ fontSize: "10px", fontWeight: "900", color: "var(--nm-text-muted)", textTransform: "uppercase" }}>{pagination.total} itens</span>
                  </div>
                  <div style={{ background: "var(--nm-surface-deep)", borderRadius: "var(--nm-radius-md)", flex: 1, overflowY: "auto", padding: "0.5rem", border: "1px solid var(--nm-border)" }} className="custom-scrollbar">
                    {products.map(p => {
                      const isSelected = !!selectedItems.find(i => i.productId === p.id);
                      return (
                        <div key={p.id} style={{ padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--nm-border)" }}>
                          <div>
                            <span style={{ fontSize: "10px", color: "var(--nm-text-muted)", fontFamily: "monospace" }}>{p.sku || 'SEM SKU'}</span>
                            <div style={{ fontSize: "var(--nm-text-sm)", fontWeight: "bold", color: isSelected ? "var(--nm-success)" : "var(--nm-text-primary)" }}>{p.name}</div>
                          </div>
                          <button 
                            onClick={() => handleSelectItem(p)}
                            disabled={isSelected}
                            className={`nm-btn ${isSelected ? 'nm-btn--disabled' : 'nm-btn--success'}`}
                            style={{ padding: "0.5rem", minWidth: "auto", width: "2.5rem", height: "2.5rem" }}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Cart */}
                <div style={{ display: (isMobile && activeMobileTab !== 'cart') ? 'none' : 'flex', flexDirection: "column", gap: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "var(--nm-text-sm)", fontWeight: "900", color: "var(--nm-text-primary)" }}>Itens Selecionados</span>
                    <button onClick={() => setSelectedItems([])} style={{ fontSize: "10px", fontWeight: "900", color: "var(--nm-danger)", textTransform: "uppercase", background: "none", border: "none", cursor: "pointer" }}>Limpar</button>
                  </div>
                  <div style={{ background: "var(--nm-surface)", borderRadius: "var(--nm-radius-md)", border: "1px solid var(--nm-border)", flex: 1, overflowY: "auto", padding: "1rem", boxShadow: "var(--nm-shadow-inset)" }} className="custom-scrollbar">
                    {selectedItems.map(item => (
                      <div key={item.productId} style={{ padding: "1rem", background: "var(--nm-surface-raised)", borderRadius: "var(--nm-radius-sm)", marginBottom: "1rem", boxShadow: "var(--nm-shadow-flat)", position: "relative" }}>
                        <button onClick={() => removeItem(item.productId)} style={{ position: "absolute", top: "1rem", right: "1rem", color: "var(--nm-danger)", background: "none", border: "none", cursor: "pointer" }}>
                          <Trash2 size={16} />
                        </button>
                        <span style={{ fontSize: "10px", color: "var(--nm-text-muted)", fontFamily: "monospace" }}>{item.sku}</span>
                        <div style={{ fontSize: "var(--nm-text-sm)", fontWeight: "bold", color: "var(--nm-text-primary)", marginBottom: "1rem" }}>{item.name}</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                          <div className="nm-input-group">
                            <label className="nm-input-group__label">Custo</label>
                            <input className="nm-input" value={item.costPrice} onChange={e => updateItem(item.productId, "costPrice", applyCurrencyMask(e.target.value))} />
                          </div>
                          <div className="nm-input-group">
                            <label className="nm-input-group__label">Qtd</label>
                            <input type="number" className="nm-input" value={item.quantity} onChange={e => updateItem(item.productId, "quantity", e.target.value)} min="1" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div style={{ maxWidth: "600px", margin: "0 auto", padding: "2rem 0", width: "100%" }}>
              <div style={{ padding: "2rem", borderRadius: "var(--nm-radius-xl)", background: "var(--nm-surface)", boxShadow: "var(--nm-shadow-raised)", textAlign: "center", marginBottom: "2rem", border: "1px solid var(--nm-border)" }}>
                <span style={{ fontSize: "10px", color: "var(--nm-text-muted)", fontWeight: "900", textTransform: "uppercase" }}>Custo Total Estimado</span>
                <div style={{ fontSize: "3rem", fontWeight: "900", color: "var(--nm-success)", margin: "0.5rem 0" }}>{formatCentsToBRL(calculateTotal())}</div>
                <div style={{ display: "flex", justifyContent: "center", gap: "1rem", fontSize: "10px", color: "var(--nm-text-secondary)", fontWeight: "bold", textTransform: "uppercase" }}>
                  <span><Package size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} /> {selectedItems.length} Itens</span>
                  <span>|</span>
                  <span><ArrowRight size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} /> {entryType === 'propria' ? 'Acerto Direto' : supplier}</span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <label className="nm-input-group__label" style={{ textAlign: "center" }}>Para onde vai essa mercadoria?</label>
                
                <button onClick={() => handleFinalize("deposito")} disabled={loading} style={{ padding: "1.5rem", borderRadius: "var(--nm-radius-md)", background: "var(--nm-surface)", border: "1px solid var(--nm-border)", display: "flex", alignItems: "center", gap: "1rem", boxShadow: "var(--nm-shadow-flat)", cursor: "pointer", transition: "all 0.2s" }}>
                  <div style={{ width: "3rem", height: "3rem", borderRadius: "1rem", background: "var(--nm-surface-deep)", color: "var(--nm-text-primary)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--nm-shadow-inset)" }}>
                    <Warehouse size={24} />
                  </div>
                  <div style={{ textAlign: "left", flex: 1 }}>
                    <span style={{ fontSize: "1.1rem", fontWeight: "900", color: "var(--nm-text-primary)", display: "block" }}>Estoque Central</span>
                    <span style={{ fontSize: "10px", color: "var(--nm-text-muted)", fontWeight: "900", textTransform: "uppercase" }}>Aumentar saldo do depósito principal</span>
                  </div>
                  <ArrowRight size={20} color="var(--nm-text-muted)" />
                </button>

                <div style={{ margin: "1rem 0", textAlign: "center", fontSize: "10px", fontWeight: "900", textTransform: "uppercase", color: "var(--nm-text-muted)" }}>Ou entregar para</div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  {employees.map(seller => (
                    <button key={seller.id} onClick={() => handleFinalize("vendedor", seller.id)} disabled={loading} style={{ padding: "1rem", borderRadius: "var(--nm-radius-md)", background: "var(--nm-surface)", border: "1px solid var(--nm-border)", display: "flex", alignItems: "center", gap: "1rem", boxShadow: "var(--nm-shadow-flat)", cursor: "pointer", transition: "all 0.2s" }}>
                      <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.75rem", background: "var(--nm-surface-deep)", color: "var(--nm-text-primary)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--nm-shadow-inset)" }}>
                        <User size={18} />
                      </div>
                      <div style={{ textAlign: "left" }}>
                        <span style={{ fontSize: "var(--nm-text-sm)", fontWeight: "900", color: "var(--nm-text-primary)", display: "block" }}>{seller.name}</span>
                        <span style={{ fontSize: "9px", color: "var(--nm-text-muted)", fontWeight: "900", textTransform: "uppercase" }}>Vendedor</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="nm-modal__footer" style={{ justifyContent: "space-between" }}>
          <button onClick={step === 1 ? handleCancelClick : () => setStep(step - 1)} className="nm-btn" style={{ padding: "0.5rem 1rem", fontSize: "var(--nm-text-xs)" }}>
            {step === 1 ? 'Sair' : 'Voltar'}
          </button>
          
          {step < 3 && (
            <button 
              disabled={step === 2 && selectedItems.length === 0}
              onClick={() => setStep(step + 1)}
              className={`nm-btn nm-btn--success ${step === 2 && selectedItems.length === 0 ? 'nm-btn--disabled' : ''}`}
            >
              Prosseguir
            </button>
          )}
        </footer>
      </div>

      {showCancelConfirm && (
        <div className="nm-modal-backdrop" style={{ zIndex: 110 }}>
          <div className="nm-modal nm-modal--sm" style={{ padding: "2rem", textAlign: "center", margin: "auto" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "900", color: "var(--nm-text-primary)", marginBottom: "1rem" }}>Descartar Entrada?</h3>
            <p style={{ fontSize: "var(--nm-text-sm)", color: "var(--nm-text-secondary)", marginBottom: "2rem" }}>Você adicionou itens. Todo o progresso será perdido se sair agora.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <button onClick={() => setShowCancelConfirm(false)} className="nm-btn">Continuar Editando</button>
              <button onClick={() => { setShowCancelConfirm(false); onClose(); reset(); }} className="nm-btn nm-btn--danger">Sim, Descartar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
