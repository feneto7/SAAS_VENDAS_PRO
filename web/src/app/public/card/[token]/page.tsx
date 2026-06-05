"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { 
  ShoppingBag, 
  Search, 
  Plus, 
  Minus, 
  Check, 
  ArrowRight, 
  Info,
  Loader2,
  Package,
} from "lucide-react";
import { formatCentsToBRL } from "@/utils/money";
import { motion, AnimatePresence } from "framer-motion";

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001";

interface Product {
  id: string;
  name: string;
  sku?: string;
  category?: string;
  priceCC: number | string;
  priceSC: number | string;
  active: boolean;
}

interface Ficha {
  id: string;
  clientName: string;
  routeName: string;
}

function PublicFichaContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const token = params.token as string;
  const tenant = searchParams.get("tenant");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [card, setFicha] = useState<Ficha | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Record<string, { quantity: number; type: "SC" | "CC" }>>({});

  useEffect(() => {
    if (token && tenant) {
      fetchFicha();
    } else {
      setError("Link inválido ou incompleto. Certifique-se de usar o link enviado.");
      setLoading(false);
    }
  }, [token, tenant]);

  async function fetchFicha() {
    try {
      const res = await fetch(`${SERVER_URL}/api/public-card/${token}?tenant=${tenant}`);
      if (!res.ok) throw new Error("Link inválido ou já finalizado");
      const data = await res.json();
      setFicha(data.card);
      setProducts(data.products || []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erro desconhecido";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = useMemo(() => {
    if (!search) return products;
    return products.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      p.sku?.toLowerCase().includes(search.toLowerCase())
    );
  }, [products, search]);

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      const existing = prev[productId] || { quantity: 0, type: "SC" };
      const newQty = Math.max(0, existing.quantity + delta);
      
      if (newQty === 0) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [productId]: { ...existing, quantity: newQty }
      };
    });
  };

  const toggleType = (productId: string) => {
    setCart(prev => {
      if (!prev[productId]) return prev;
      return {
        ...prev,
        [productId]: { ...prev[productId], type: prev[productId].type === "CC" ? "SC" : "CC" }
      };
    });
  };

  const cartTotal = useMemo(() => {
    return Object.entries(cart).reduce((sum, [id, item]) => {
      const product = products.find(p => p.id === id);
      if (!product) return sum;
      const price = item.type === "CC" ? Number(product.priceCC) : Number(product.priceSC);
      return sum + (price * item.quantity);
    }, 0);
  }, [cart, products]);

  const cartCount = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);

  const handleFinalize = async () => {
    if (cartCount === 0) return;
    setSubmitting(true);
    try {
      const items = Object.entries(cart).map(([productId, item]) => ({
        productId,
        quantity: item.quantity,
        type: item.type
      }));

      const res = await fetch(`${SERVER_URL}/api/public-card/${token}/finalize?tenant=${tenant}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items })
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        alert("Erro ao finalizar pedido");
      }
    } catch (err) {
      alert("Erro de conexão");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center" style={{ backgroundColor: "var(--nm-bg)" }}>
        <Loader2 className="animate-spin" style={{ color: "var(--nm-accent)" }} size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-6 text-center" style={{ backgroundColor: "var(--nm-bg)" }}>
        <div className="max-w-md space-y-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: "var(--nm-surface)", boxShadow: "var(--nm-shadow-raised)" }}>
            <Info className="text-red-500" size={40} />
          </div>
          <h1 className="text-2xl font-black text-[var(--nm-text-primary)] uppercase tracking-tighter">Ops! Link Inválido</h1>
          <p className="text-[var(--nm-text-secondary)]">{error}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-6 text-center" style={{ backgroundColor: "var(--nm-bg)" }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="nm-card max-w-md w-full space-y-8"
        >
          <div className="w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto" style={{ backgroundColor: "var(--nm-success)", boxShadow: "0 10px 30px -10px var(--nm-success)" }}>
            <Check className="text-black" size={48} strokeWidth={3} />
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-black text-[var(--nm-text-primary)] uppercase tracking-tighter leading-none">Pedido Enviado!</h1>
            <p className="text-[var(--nm-text-secondary)] font-medium">Seu pedido foi registrado com sucesso e já está com nossa equipe.</p>
          </div>
          <div className="pt-4 border-t text-[10px] font-black text-[var(--nm-text-muted)] uppercase tracking-widest" style={{ borderColor: "var(--nm-border)" }}>
            VENDAS PRO - SISTEMA DE GESTÃO
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", width: "100%", display: "flex", flexDirection: "column", backgroundColor: "var(--nm-bg)", color: "var(--nm-text-primary)" }}>
      {/* ── HEADER ────────────────────────────────── */}
      <header style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        width: "100%",
        backgroundColor: "color-mix(in srgb, var(--nm-bg) 85%, transparent)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--nm-border)",
      }}>
        <div style={{ width: "100%", maxWidth: "1280px", margin: "0 auto", padding: "1.25rem clamp(1rem, 3vw, 2.5rem) 1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div className="nm-icon-circle nm-icon-circle--accent" style={{ width: "2.5rem", height: "2.5rem", flexShrink: 0 }}>
              <ShoppingBag size={18} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ fontSize: "0.875rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.025em", color: "var(--nm-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {card?.clientName}
              </h1>
              <p style={{ fontSize: "10px", color: "var(--nm-text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: "2px" }}>
                Rota: {card?.routeName}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ── SEARCH BAR ────────────────────────────── */}
      <div style={{ width: "100%", maxWidth: "1280px", margin: "0 auto", padding: "1rem clamp(1rem, 3vw, 2.5rem) 0" }}>
        <div style={{ position: "relative" }}>
          <Search style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--nm-text-muted)", zIndex: 10 }} size={18} />
          <input 
            type="text"
            placeholder="Buscar produtos..."
            className="nm-input"
            style={{ width: "100%", paddingLeft: "2.75rem", paddingRight: "1rem", height: "3rem", borderRadius: "1.5rem", fontSize: "0.875rem" }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── PRODUCT GRID ──────────────────────────── */}
      <main style={{ flex: 1, width: "100%", maxWidth: "1280px", margin: "0 auto", padding: "1rem clamp(1rem, 3vw, 2.5rem) 8rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: "1rem" }}>
          {filteredProducts.map((p) => {
            const inCart = cart[p.id];
            const price = (inCart?.type === 'CC' ? Number(p.priceCC) : Number(p.priceSC)) || Number(p.priceSC);

            return (
              <motion.div 
                layout
                key={p.id}
                className="nm-card"
                style={{ 
                  padding: "0.75rem",
                  boxShadow: inCart ? "0 0 0 1.5px var(--nm-accent), var(--nm-shadow-raised)" : "var(--nm-shadow-raised)",
                  borderRadius: "1rem",
                  display: "flex",
                  flexDirection: "column",
                  transition: "box-shadow 0.2s ease, transform 0.2s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                  {/* FOTO / ICONE */}
                  <div style={{ width: "3rem", height: "3rem", flexShrink: 0, borderRadius: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--nm-text-muted)", backgroundColor: "var(--nm-surface-deep)", boxShadow: "var(--nm-shadow-inset)" }}>
                    <Package size={22} />
                  </div>
                  
                  {/* DADOS */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
                      <h3 style={{ fontSize: "0.875rem", fontWeight: 700, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--nm-text-primary)" }}>{p.name}</h3>
                      {p.category && (
                        <span style={{ flexShrink: 0, padding: "2px 8px", borderRadius: "9999px", fontSize: "8px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--nm-text-muted)", backgroundColor: "var(--nm-surface)", boxShadow: "var(--nm-shadow-raised)" }}>
                          {p.category}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: "10px", color: "var(--nm-text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Ref: {p.sku || 'N/D'}</p>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                      <p style={{ fontSize: "0.875rem", fontWeight: 900, color: "var(--nm-text-primary)" }}>{formatCentsToBRL(price)}</p>
                      {inCart && (
                        <button
                          onClick={() => toggleType(p.id)}
                          style={{
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontSize: "9px",
                            fontWeight: 900,
                            transition: "all 0.15s",
                            backgroundColor: inCart.type === 'CC' ? "var(--nm-accent-transparent)" : "var(--nm-surface)",
                            color: inCart.type === 'CC' ? "var(--nm-accent)" : "var(--nm-text-muted)",
                            border: `1px solid ${inCart.type === 'CC' ? 'var(--nm-accent)' : 'var(--nm-border)'}`
                          }}
                        >
                          {inCart.type}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* CONTROLES */}
                <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                  {!inCart ? (
                    <button 
                      onClick={() => updateQuantity(p.id, 1)}
                      className="nm-btn nm-btn--sm nm-btn--flat"
                      style={{ height: "2.25rem", padding: "0 1rem", fontSize: "11px", width: "100%", justifyContent: "center" }}
                    >
                      <Plus size={14} />
                      Adicionar
                    </button>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", width: "100%", maxWidth: "200px", margin: "0 auto", padding: "4px", borderRadius: "0.75rem", backgroundColor: "var(--nm-surface-deep)", boxShadow: "var(--nm-shadow-inset)" }}>
                      <button 
                        onClick={() => updateQuantity(p.id, -1)}
                        style={{ width: "2rem", height: "2rem", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.5rem", color: "var(--nm-text-primary)", backgroundColor: "var(--nm-surface)", boxShadow: "var(--nm-shadow-raised)", border: "none", cursor: "pointer", transition: "transform 0.1s" }}
                      >
                        <Minus size={14} />
                      </button>
                      <span style={{ flex: 1, textAlign: "center", fontWeight: 900, fontSize: "0.875rem", color: "var(--nm-text-primary)" }}>{inCart.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(p.id, 1)}
                        style={{ width: "2rem", height: "2rem", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.5rem", color: "var(--nm-text-primary)", backgroundColor: "var(--nm-surface)", boxShadow: "var(--nm-shadow-raised)", border: "none", cursor: "pointer", transition: "transform 0.1s" }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
          
          {filteredProducts.length === 0 && (
             <div style={{ textAlign: "center", padding: "3rem 0", gridColumn: "1 / -1" }}>
               <Package size={40} style={{ margin: "0 auto 1rem", color: "var(--nm-border)" }} />
               <p style={{ color: "var(--nm-text-muted)", fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Nenhum produto encontrado</p>
             </div>
          )}
        </div>
      </main>

      {/* ── FIXED BOTTOM BAR (Checkout) ────────────── */}
      <div 
        style={{ 
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          padding: "1rem clamp(1rem, 3vw, 2.5rem) 1.5rem",
          background: "linear-gradient(to top, var(--nm-bg) 70%, transparent)",
          pointerEvents: "none",
        }}
      >
        <div 
          className="nm-card"
          style={{ 
            maxWidth: "1280px",
            width: "100%",
            margin: "0 auto",
            padding: "1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pointerEvents: "auto", 
            borderRadius: "1.5rem",
            boxShadow: "0 -4px 30px rgba(0,0,0,0.3), var(--nm-shadow-raised)",
          }}
        >
          <div style={{ flex: 1, minWidth: 0, paddingRight: "1rem" }}>
            <p style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--nm-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {cartCount === 0 ? "Seu Pedido" : `${cartCount} ${cartCount === 1 ? 'item' : 'itens'}`}
            </p>
            <p style={{ fontSize: "1.125rem", fontWeight: 900, color: "var(--nm-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {formatCentsToBRL(cartTotal)}
            </p>
          </div>
          <button 
            onClick={handleFinalize}
            disabled={cartCount === 0 || submitting}
            className="nm-btn nm-btn--accent"
            style={{ 
              flexShrink: 0,
              height: "3rem", 
              padding: "0 1.25rem", 
              borderRadius: "1rem",
              fontSize: "12px",
              opacity: cartCount === 0 ? 0.5 : 1,
              filter: cartCount === 0 ? "grayscale(1)" : "none",
              pointerEvents: cartCount === 0 ? "none" : "auto",
            }}
          >
            {submitting ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} strokeWidth={3} />}
            Finalizar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PublicFichaPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] w-full flex items-center justify-center" style={{ backgroundColor: "var(--nm-bg)" }}><Loader2 className="animate-spin" style={{ color: "var(--nm-accent)" }} size={40} /></div>}>
      <PublicFichaContent />
    </Suspense>
  );
}
