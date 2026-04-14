"use client";

import { useState, useEffect } from "react";
import { X, User, MapPin, Phone, Calendar, Briefcase, Package, CreditCard, Info } from "lucide-react";
import { formatCentsToBRL } from "@/utils/money";
import { Pagination } from "@/components/dashboard/shared/Pagination";

interface FichaDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  fichaId: string | null;
  tenantSlug: string;
}

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001";

export function FichaDetailModal({ isOpen, onClose, fichaId, tenantSlug }: FichaDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [ficha, setFicha] = useState<any>(null);
  const [itemPage, setItemPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (isOpen && fichaId) {
      fetchFichaDetails();
    } else {
      setFicha(null);
      setItemPage(1);
    }
  }, [isOpen, fichaId]);

  const fetchFichaDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${SERVER_URL}/api/fichas/${fichaId}`, {
        headers: { "x-tenant-slug": tenantSlug }
      });
      if (res.ok) {
        const data = await res.json();
        setFicha(data);
      }
    } catch (err) {
      console.error("Erro ao buscar detalhes da ficha:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const paginatedItems = ficha?.items?.slice((itemPage - 1) * itemsPerPage, itemPage * itemsPerPage) || [];
  const totalItemPages = Math.ceil((ficha?.items?.length || 0) / itemsPerPage);

  const sectionLabel = "text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-4";
  const dataLabel = "text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1";
  const dataValue = "text-sm font-medium text-white";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-5xl h-fit max-h-[90vh] bg-[#0c0c0c] border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 shadow-emerald-500/5">
        
        {/* Header */}
        <header className="px-8 py-6 border-b border-white/5 flex items-center justify-between shrink-0 bg-gradient-to-r from-emerald-500/5 to-transparent">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
              <Info className="text-emerald-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight leading-none">
                {ficha ? `Ficha #${ficha.code || ficha.id.substring(0,8)}` : "Carregando..."}
              </h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2">
                Detalhamento Completo da Venda
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-all">
            <X size={24} />
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {loading && !ficha ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 text-gray-500">
              <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-xs font-black uppercase tracking-widest">Buscando dados...</p>
            </div>
          ) : ficha && (
            <div className="space-y-10">
              
              {/* 1. Header Block: Info Cliente / Vendedor */}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-white/[0.02] border border-white/5 p-6 rounded-3xl space-y-6">
                  <h3 className={sectionLabel}><User size={14} /> Dados do Cliente</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <span className={dataLabel}>Nome</span>
                      <p className={dataValue}>{ficha.client?.name}</p>
                    </div>
                    <div>
                      <span className={dataLabel}>Contato</span>
                      <p className={dataValue}>{ficha.client?.phone || "Não informado"}</p>
                    </div>
                    <div className="col-span-2">
                      <span className={dataLabel}>Endereço</span>
                      <p className={dataValue}>
                        {ficha.client?.street}, {ficha.client?.number} - {ficha.client?.neighborhood}<br/>
                        {ficha.client?.city} / {ficha.client?.state}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl flex flex-col justify-between">
                  <div className="space-y-6">
                    <h3 className={sectionLabel}><Briefcase size={14} /> Vendedor & Data</h3>
                    <div>
                      <span className={dataLabel}>Responsável</span>
                      <p className={dataValue}>{ficha.seller?.name}</p>
                    </div>
                    <div>
                      <span className={dataLabel}>Data da Venda</span>
                      <p className={dataValue}>{new Date(ficha.saleDate).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* 2. Stats Block: Valores */}
              <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-3xl">
                  <span className={dataLabel}>Total da Ficha</span>
                  <p className="text-xl font-black text-emerald-400">{formatCentsToBRL(ficha.total)}</p>
                </div>
                <div className="bg-purple-500/5 border border-purple-500/10 p-5 rounded-3xl">
                  <span className={dataLabel}>Produtos CC</span>
                  <p className="text-xl font-black text-purple-400">{formatCentsToBRL(ficha.stats?.totalCC)}</p>
                </div>
                <div className="bg-blue-500/5 border border-blue-500/10 p-5 rounded-3xl">
                  <span className={dataLabel}>Produtos SC</span>
                  <p className="text-xl font-black text-blue-400">{formatCentsToBRL(ficha.stats?.totalSC)}</p>
                </div>
                <div className="bg-white/5 border border-white/10 p-5 rounded-3xl">
                  <span className={dataLabel}>Qtd Itens</span>
                  <p className="text-xl font-black text-white">{ficha.stats?.itemCount} unid</p>
                </div>
              </section>

              {/* 3. Items Table */}
              <section className="space-y-4">
                <h3 className={sectionLabel}><Package size={14} /> Itens da Venda</h3>
                <div className="border border-white/5 rounded-2xl overflow-hidden bg-black/20">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-white/5 text-gray-500 font-black uppercase tracking-widest border-b border-white/5">
                        <th className="px-6 py-4">Produto</th>
                        <th className="px-6 py-4 text-center">Tipo</th>
                        <th className="px-6 py-4 text-center">Qtd</th>
                        <th className="px-6 py-4 text-right">Unitário</th>
                        <th className="px-6 py-4 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                      {paginatedItems.map((item: any) => (
                        <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-3">
                            <p className="font-bold text-gray-300">{item.productName}</p>
                            <p className="text-[10px] text-gray-600 font-mono">SKU: {item.sku}</p>
                          </td>
                          <td className="px-6 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${item.commissionType === 'CC' ? 'bg-purple-500/10 text-purple-400' : 'bg-white/5 text-gray-500'}`}>
                              {item.commissionType}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-center">
                            {ficha.status === 'paga' ? (
                              <div className="flex flex-col items-center">
                                <div className="text-[10px] font-black text-white/40 mb-1 border-b border-white/5 pb-1 w-full text-center">
                                  {item.quantity} <span className="text-[8px] uppercase tracking-tighter">Total</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-white font-bold">{item.quantitySold}</span>
                                  <span className="text-[8px] text-emerald-500 uppercase font-black">vend</span>
                                </div>
                                <div className="flex items-center gap-1 opacity-50">
                                  <span className="text-gray-400 font-medium">{item.quantityReturned}</span>
                                  <span className="text-[8px] text-gray-500 uppercase font-bold">dev</span>
                                </div>
                              </div>
                            ) : (
                              <span className="font-bold text-gray-400">{item.quantity}</span>
                            )}
                          </td>
                          <td className="px-6 py-3 text-right text-gray-400">{formatCentsToBRL(item.unitPrice)}</td>
                          <td className="px-6 py-3 text-right font-black text-white">{formatCentsToBRL(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {totalItemPages > 1 && (
                    <div className="p-4 border-t border-white/5">
                      <Pagination 
                        currentPage={itemPage}
                        totalPages={totalItemPages}
                        onPageChange={setItemPage}
                        loading={false}
                      />
                    </div>
                  )}
                </div>
              </section>

              {/* 4. Observations */}
              <section>
                <h3 className={sectionLabel}><MapPin size={14} /> Observações</h3>
                <div className="bg-white/[0.04] border border-white/10 p-6 rounded-3xl min-h-[80px]">
                  <p className="text-sm text-gray-400 leading-relaxed italic">
                    {ficha.notes || "Nenhuma observação cadastrada."}
                  </p>
                </div>
              </section>

              {/* 5. Payments List */}
              <section className="space-y-4">
                <h3 className={sectionLabel}><CreditCard size={14} /> Pagamentos Lançados</h3>
                {ficha.payments?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ficha.payments.map((p: any) => (
                      <div key={p.id} className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">{p.methodName || p.method}</p>
                          <p className="text-sm font-bold text-white">{formatCentsToBRL(p.amount)}</p>
                        </div>
                        <p className="text-[10px] text-gray-500 font-medium">
                          {new Date(p.paymentDate).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center opacity-30">
                    <CreditCard size={24} className="mb-2" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Nenhum pagamento registrado</p>
                  </div>
                )}
              </section>

            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="px-8 py-6 border-t border-white/5 flex justify-end shrink-0">
          <button 
            onClick={onClose}
            className="px-10 py-4 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            Fechar Detalhes
          </button>
        </footer>
      </div>
    </div>
  );
}
