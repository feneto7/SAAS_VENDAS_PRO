"use client";

import { useState, useEffect } from "react";
import { X, User, MapPin, Phone, Calendar, Briefcase, Package, CreditCard, Info, Lock, Unlock } from "lucide-react";
import { formatCentsToBRL } from "@/utils/money";
import { Pagination } from "@/components/dashboard/shared/Pagination";

interface FichaDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardId: string | null;
  tenantSlug: string;
}

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001";

export function FichaDetailModal({ isOpen, onClose, cardId, tenantSlug }: FichaDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [togglingLock, setTogglingLock] = useState(false);
  const [card, setFicha] = useState<any>(null);
  const [itemPage, setItemPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (isOpen && cardId) {
      fetchFichaDetails();
    } else {
      setFicha(null);
      setItemPage(1);
    }
  }, [isOpen, cardId]);

  const fetchFichaDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${SERVER_URL}/api/cards/${cardId}`, {
        headers: { "x-tenant-slug": tenantSlug }
      });
      if (res.ok) {
        const data = await res.json();
        setFicha(data);
      }
    } catch (err) {
      console.error("Erro ao buscar detalhes da card:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleLock = async () => {
    if (!card) return;
    try {
      setTogglingLock(true);
      const newLockedState = !card.itemsLocked;
      const res = await fetch(`${SERVER_URL}/api/cards/${card.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantSlug
        },
        body: JSON.stringify({ itemsLocked: newLockedState })
      });
      
      if (res.ok) {
        setFicha({ ...card, itemsLocked: newLockedState });
      } else {
        alert("Erro ao alternar bloqueio da card");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao alternar bloqueio da card");
    } finally {
      setTogglingLock(false);
    }
  };

  if (!isOpen) return null;

  const paginatedItems = card?.items?.slice((itemPage - 1) * itemsPerPage, itemPage * itemsPerPage) || [];
  const totalItemPages = Math.ceil((card?.items?.length || 0) / itemsPerPage);

  const sectionLabel = "nm-heading flex items-center gap-2 mb-4";
  const dataLabel = "nm-input-group__label mb-1";
  const dataValue = "text-sm font-bold text-[var(--nm-text-primary)]";

  return (
    <div className="nm-modal-backdrop" onClick={onClose}>
      <div className="nm-modal nm-modal--xl" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <header className="nm-modal__header" style={{ paddingRight: "4rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div className="nm-icon-circle nm-icon-circle--info nm-icon-circle--lg">
              <Info size={20} />
            </div>
            <div>
              <h2 className="nm-modal__title">
                {card ? `Ficha #${card.code || card.id.substring(0,8)}` : "Carregando..."}
              </h2>
              <p className="nm-modal__subtitle" style={{ textTransform: "uppercase", fontWeight: "bold", fontSize: "10px" }}>
                Detalhamento Completo da Venda
              </p>
            </div>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginLeft: "auto" }}>
            {card?.status === 'pendente' && (
              <button 
                onClick={toggleLock} 
                disabled={togglingLock}
                className={`nm-btn nm-btn--sm ${card?.itemsLocked ? 'nm-btn--danger' : 'nm-btn--accent'}`}
                title={card?.itemsLocked ? "Ficha Bloqueada (Clique para Desbloquear)" : "Ficha Desbloqueada (Clique para Bloquear)"}
              >
                {togglingLock ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : card?.itemsLocked ? (
                  <Lock size={14} />
                ) : (
                  <Unlock size={14} />
                )}
                <span className="ml-1 hidden sm:inline">{togglingLock ? "Alternando..." : (card?.itemsLocked ? "Desbloquear Ficha" : "Ficha Liberada")}</span>
              </button>
            )}
          </div>

          <button onClick={onClose} className="nm-modal__close">
            <X size={18} />
          </button>
        </header>

        {/* Content */}
        <div className="nm-modal__body custom-scrollbar">
          {loading && !card ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 text-[var(--nm-text-muted)]">
              <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
              <p className="nm-input-group__label">Buscando dados...</p>
            </div>
          ) : card && (
            <div className="max-w-5xl mx-auto space-y-8">
              
              {/* 1. Header Block: Info Cliente / Vendedor */}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 nm-card nm-card--sm p-6 space-y-6">
                  <h3 className={sectionLabel}><User size={14} /> Dados do Cliente</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <span className={dataLabel}>Nome</span>
                      <p className={dataValue}>{card.client?.name}</p>
                    </div>
                    <div>
                      <span className={dataLabel}>Contato</span>
                      <p className={dataValue}>{card.client?.phone || "Não informado"}</p>
                    </div>
                    <div className="col-span-2">
                      <span className={dataLabel}>Endereço</span>
                      <p className={dataValue}>
                        {card.client?.street}, {card.client?.number} - {card.client?.neighborhood}<br/>
                        {card.client?.city} / {card.client?.state}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="nm-card nm-card--sm p-6 flex flex-col justify-between">
                  <div className="space-y-6">
                    <h3 className={sectionLabel}><Briefcase size={14} /> Vendedor & Data</h3>
                    <div>
                      <span className={dataLabel}>Responsável</span>
                      <p className={dataValue}>{card.seller?.name}</p>
                    </div>
                    <div>
                      <span className={dataLabel}>Data da Venda</span>
                      <p className={dataValue}>{new Date(card.saleDate).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* 2. Stats Block: Valores */}
              <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="nm-card nm-card--sm p-5 border-emerald-500/20" style={{ background: "rgba(16, 185, 129, 0.05)" }}>
                  <span className={dataLabel}>Total da Ficha</span>
                  <p className="text-xl font-black text-emerald-400">{formatCentsToBRL(card.total)}</p>
                </div>
                <div className="nm-card nm-card--sm p-5 border-purple-500/20" style={{ background: "rgba(168, 85, 247, 0.05)" }}>
                  <span className={dataLabel}>Produtos CC</span>
                  <p className="text-xl font-black text-purple-400">{formatCentsToBRL(card.stats?.totalCC)}</p>
                </div>
                <div className="nm-card nm-card--sm p-5 border-blue-500/20" style={{ background: "rgba(59, 130, 246, 0.05)" }}>
                  <span className={dataLabel}>Produtos SC</span>
                  <p className="text-xl font-black text-blue-400">{formatCentsToBRL(card.stats?.totalSC)}</p>
                </div>
                <div className="nm-card nm-card--sm p-5">
                  <span className={dataLabel}>Qtd Itens</span>
                  <p className="text-xl font-black" style={{ color: "var(--nm-text-primary)" }}>{card.stats?.itemCount} unid</p>
                </div>
              </section>

              {/* 3. Items Table */}
              <section className="space-y-4">
                <h3 className={sectionLabel}><Package size={14} /> Itens da Venda</h3>
                <div className="nm-table-wrapper">
                  <div className="nm-table-scroll">
                    <table className="nm-table">
                      <thead>
                        <tr>
                          <th>Produto</th>
                          <th style={{ textAlign: "center" }}>Tipo</th>
                          <th style={{ textAlign: "center" }}>Qtd</th>
                          <th style={{ textAlign: "right" }}>Unitário</th>
                          <th style={{ textAlign: "right" }}>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedItems.map((item: any) => (
                          <tr key={item.id}>
                            <td>
                              <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                                <span style={{ fontWeight: 600, color: "var(--nm-text-primary)" }}>{item.productName}</span>
                                <span style={{ fontSize: "10px", color: "var(--nm-text-muted)", fontFamily: "monospace" }}>SKU: {item.sku}</span>
                              </div>
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <span className={`nm-code ${item.commissionType === 'CC' ? 'text-purple-400 border-purple-500/30' : 'text-gray-400'}`} style={{ padding: "0.2rem 0.4rem", fontSize: "10px", fontWeight: "bold" }}>
                                {item.commissionType}
                              </span>
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {card.status === 'paga' ? (
                                <div className="flex flex-col items-center">
                                  <div className="text-[10px] font-black mb-1 pb-1 w-full text-center" style={{ color: "var(--nm-text-muted)", borderBottom: "1px solid var(--nm-border-color)" }}>
                                    {item.quantity} <span className="text-[8px] uppercase tracking-tighter">Total</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span style={{ fontWeight: "bold", color: "var(--nm-text-primary)" }}>{item.quantitySold}</span>
                                    <span className="text-[8px] text-emerald-500 uppercase font-black">vend</span>
                                  </div>
                                  <div className="flex items-center gap-1 opacity-70">
                                    <span style={{ fontWeight: "bold", color: "var(--nm-text-muted)" }}>{item.quantityReturned}</span>
                                    <span className="text-[8px] uppercase font-bold" style={{ color: "var(--nm-text-muted)" }}>dev</span>
                                  </div>
                                </div>
                              ) : (
                                <span style={{ fontWeight: 800 }}>{item.quantity}</span>
                              )}
                            </td>
                            <td style={{ textAlign: "right" }}>{formatCentsToBRL(item.unitPrice)}</td>
                            <td style={{ textAlign: "right", fontWeight: 800, color: "var(--nm-text-primary)" }}>{formatCentsToBRL(item.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {totalItemPages > 1 && (
                    <div style={{ padding: "1rem", borderTop: "1px solid var(--nm-border-color)" }}>
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
                <div className="nm-card nm-card--sm p-6">
                  <p style={{ fontSize: "0.875rem", color: "var(--nm-text-secondary)", lineHeight: 1.6, fontStyle: "italic" }}>
                    {card.notes || "Nenhuma observação cadastrada."}
                  </p>
                </div>
              </section>

              {/* 5. Payments List */}
              <section className="space-y-4">
                <h3 className={sectionLabel}><CreditCard size={14} /> Pagamentos Lançados</h3>
                {card.payments?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {card.payments.map((p: any) => (
                      <div key={p.id} className={`nm-card nm-card--sm p-4 flex items-center justify-between transition-all ${p.cancelled ? 'opacity-50 grayscale' : ''}`}>
                        <div className="flex items-center gap-3">
                           <div className={`nm-icon-circle nm-icon-circle--sm ${p.cancelled ? 'nm-icon-circle--danger' : 'nm-icon-circle--success'}`}>
                             <CreditCard size={14} />
                           </div>
                           <div>
                             <p className="nm-input-group__label mb-0.5" style={{ textDecoration: p.cancelled ? 'line-through' : 'none' }}>{p.methodName || p.method?.name || "Pagamento"}</p>
                             <p style={{ fontSize: "0.875rem", fontWeight: "bold", color: "var(--nm-text-primary)", textDecoration: p.cancelled ? 'line-through' : 'none' }}>{formatCentsToBRL(p.amount)}</p>
                           </div>
                        </div>
                        <div className="text-right">
                          <p style={{ fontSize: "10px", fontWeight: 500, color: "var(--nm-text-secondary)" }}>
                            {new Date(p.paymentDate).toLocaleDateString('pt-BR')}
                          </p>
                          {p.cancelled && (
                            <span className="text-[8px] font-black text-red-500 uppercase tracking-tighter mt-1 block">CANCELADO</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="nm-card nm-card--sm py-10 flex flex-col items-center justify-center opacity-50 border-dashed">
                    <CreditCard size={24} className="mb-2" />
                    <p className="nm-input-group__label">Nenhum pagamento registrado</p>
                  </div>
                )}
              </section>

            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="nm-modal__footer" style={{ justifyContent: "flex-end" }}>
          <button 
            onClick={onClose}
            className="nm-btn nm-btn--flat"
          >
            Fechar Detalhes
          </button>
        </footer>
      </div>
    </div>
  );
}
