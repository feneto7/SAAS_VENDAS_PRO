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

  const [ficha, setFicha] = useState<Ficha | null>(null);
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
      const res = await fetch(`${SERVER_URL}/api/public-ficha/${token}?tenant=${tenant}`);
      if (!res.ok) throw new Error("Link inválido ou já finalizado");
      const data = await res.json();
      setFicha(data.ficha);
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

      const res = await fetch(`${SERVER_URL}/api/public-ficha/${token}/finalize?tenant=${tenant}`, {
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="text-purple-500 animate-spin" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-4">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
            <Info className="text-red-500" size={40} />
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Ops! Link Inválido</h1>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white/[0.02] border border-white/10 rounded-[3rem] p-12 space-y-8"
        >
          <div className="w-24 h-24 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20">
            <Check className="text-black" size={48} strokeWidth={3} />
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">Pedido Enviado!</h1>
            <p className="text-gray-500 font-medium">Seu pedido foi registrado com sucesso e já está com nossa equipe.</p>
          </div>
          <div className="pt-4 border-t border-white/5 text-[10px] font-black text-gray-700 uppercase tracking-widest">
            VENDAS PRO - SISTEMA DE GESTÃO
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-purple-500 selection:text-white pb-32 lg:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
              <ShoppingBag size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-tighter leading-none">{ficha?.clientName}</h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Rota: {ficha?.routeName}</p>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-8">
             <div className="text-right">
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Total Estimado</p>
                <p className="text-xl font-black text-emerald-400">{formatCentsToBRL(cartTotal)}</p>
             </div>
             <button 
               onClick={handleFinalize}
               disabled={cartCount === 0 || submitting}
               className="bg-white text-black px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-tighter flex items-center gap-3 hover:bg-emerald-400 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none shadow-xl shadow-white/5"
             >
               {submitting ? <Loader2 className="animate-spin" size={16} /> : <ArrowRight size={16} />}
               Finalizar Pedido ({cartCount})
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Search */}
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-500 transition-colors" size={20} />
          <input 
            type="text"
            placeholder="O que você está procurando?"
            className="w-full bg-white/[0.03] border border-white/10 rounded-[2rem] py-6 pl-16 pr-8 text-lg font-bold placeholder:text-gray-700 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500/30 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((p) => {
            const inCart = cart[p.id];
            const price = (inCart?.type === 'CC' ? Number(p.priceCC) : Number(p.priceSC)) || Number(p.priceSC);

            return (
              <motion.div 
                layout
                key={p.id}
                className={`group relative bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 hover:bg-white/[0.04] hover:border-white/10 transition-all ${inCart ? 'ring-2 ring-purple-500/30' : ''}`}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-14 h-14 bg-white/5 rounded-[1.5rem] flex items-center justify-center text-gray-400 group-hover:text-purple-400 transition-colors">
                      <Package size={28} />
                    </div>
                    {p.category && (
                      <span className="bg-white/5 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-500">{p.category}</span>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-bold leading-tight group-hover:text-purple-300 transition-colors">{p.name}</h3>
                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-1">Ref: {p.sku || '----'}</p>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <div className="flex-1">
                      <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Unitário ({inCart?.type || 'Pad.'})</p>
                      <p className="text-xl font-black text-white">{formatCentsToBRL(price)}</p>
                    </div>
                    {inCart && (
                        <button
                            onClick={() => toggleType(p.id)}
                            title="Mudar tipo (CC/SC)"
                            className={`px-4 py-2 rounded-xl text-[9px] font-black transition-all border ${
                                inCart.type === 'CC' 
                                ? 'bg-purple-500/20 border-purple-500/40 text-purple-400' 
                                : 'bg-white/5 border-white/10 text-gray-500'
                            }`}
                        >
                            {inCart.type}
                        </button>
                    )}
                  </div>

                  <div className="pt-4">
                    {!inCart ? (
                      <button 
                        onClick={() => updateQuantity(p.id, 1)}
                        className="w-full bg-white text-black py-4 rounded-2xl text-xs font-black uppercase tracking-tighter flex items-center justify-center gap-2 hover:bg-purple-500 hover:text-white transition-all active:scale-95"
                      >
                        <Plus size={16} />
                        Adicionar
                      </button>
                    ) : (
                      <div className="flex items-center gap-4 bg-black/40 p-2 rounded-2xl border border-white/5">
                        <button 
                          onClick={() => updateQuantity(p.id, -1)}
                          className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all active:scale-90"
                        >
                          <Minus size={18} />
                        </button>
                        <span className="flex-1 text-center font-black text-lg">{inCart.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(p.id, 1)}
                          className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all active:scale-90"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>

      {/* Floating Bottom Bar (Mobile) */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 p-6 lg:hidden"
          >
            <div className="bg-white text-black rounded-[2.5rem] p-6 flex items-center justify-between shadow-2xl shadow-purple-500/20 max-w-lg mx-auto">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Total do Pedido</p>
                <p className="text-2xl font-black leading-none">{formatCentsToBRL(cartTotal)}</p>
              </div>
              <button 
                onClick={handleFinalize}
                disabled={submitting}
                className="bg-black text-white px-8 py-4 rounded-[1.5rem] text-xs font-black uppercase tracking-tighter flex items-center gap-3 active:scale-95 shadow-lg"
              >
                {submitting ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} strokeWidth={3} />}
                {submitting ? 'Enviando...' : `Finalizar (${cartCount})`}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PublicFichaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="text-purple-500 animate-spin" size={40} /></div>}>
      <PublicFichaContent />
    </Suspense>
  );
}
