"use client";

import { useEffect, useState } from "react";
import { 
  Building2, 
  CreditCard, 
  Save, 
  Plus, 
  Trash2, 
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react";
import { format } from "date-fns";

interface PaymentMethod {
  id: string;
  name: string;
  active: boolean;
}

interface CompanyData {
  name: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  contact: string;
}

interface SettingsTabProps {
  serverUrl: string;
  tenantSlug: string;
}

export function SettingsTab({ serverUrl, tenantSlug }: SettingsTabProps) {
  const [activeSection, setActiveSection] = useState<"company" | "payments">("company");
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newMethodName, setNewMethodName] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Company Info
      const infoRes = await fetch(`${serverUrl}/tenant/info`, {
        headers: { "x-tenant-slug": tenantSlug },
      });
      if (infoRes.ok) {
        const data = await infoRes.json();
        setCompany({
          name: data.name || "",
          street: data.street || "",
          number: data.number || "",
          neighborhood: data.neighborhood || "",
          city: data.city || "",
          state: data.state || "",
          zipCode: data.zipCode || "",
          contact: data.contact || "",
        });
      }

      // Fetch Payment Methods
      const payRes = await fetch(`${serverUrl}/api/settings/payments`, {
        headers: { "x-tenant-slug": tenantSlug },
      });
      if (payRes.ok) {
        setPaymentMethods(await payRes.json());
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tenantSlug]);

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    setSaving(true);
    try {
      const res = await fetch(`${serverUrl}/api/settings/company`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "x-tenant-slug": tenantSlug 
        },
        body: JSON.stringify(company),
      });
      if (res.ok) {
        // Success notification or reload
        window.location.reload(); // Quick way to update layout info
      }
    } catch (err) {
      console.error("Error saving company:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddPaymentMethod = async () => {
    if (!newMethodName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${serverUrl}/api/settings/payments`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-tenant-slug": tenantSlug 
        },
        body: JSON.stringify({ name: newMethodName }),
      });
      if (res.ok) {
        setNewMethodName("");
        fetchData();
      }
    } catch (err) {
      console.error("Error adding payment method:", err);
    } finally {
      setSaving(false);
    }
  };

  const togglePaymentMethod = async (method: PaymentMethod) => {
    try {
      await fetch(`${serverUrl}/api/settings/payments`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-tenant-slug": tenantSlug 
        },
        body: JSON.stringify({ ...method, active: !method.active }),
      });
      fetchData();
    } catch (err) {
      console.error("Error toggling payment method:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Tabs */}
      <div className="flex gap-2 p-1 bg-black/40 rounded-2xl w-fit border border-white/5 shadow-inner">
        <button
          onClick={() => setActiveSection("company")}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            activeSection === "company" 
              ? "bg-[var(--nm-accent-color)]/20 text-[var(--nm-accent-color)] border border-[var(--nm-accent-color)]/30 shadow-[0_0_15px_var(--nm-accent-color)]/20" 
              : "text-gray-500 hover:text-white hover:bg-white/5 border border-transparent"
          }`}
        >
          <Building2 size={16} />
          Dados da Empresa
        </button>
        <button
          onClick={() => setActiveSection("payments")}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            activeSection === "payments" 
              ? "bg-[var(--nm-accent-color)]/20 text-[var(--nm-accent-color)] border border-[var(--nm-accent-color)]/30 shadow-[0_0_15px_var(--nm-accent-color)]/20" 
              : "text-gray-500 hover:text-white hover:bg-white/5 border border-transparent"
          }`}
        >
          <CreditCard size={16} />
          Formas de Pagamento
        </button>
      </div>

      {activeSection === "company" && company && (
        <div className="nm-card nm-card--sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="p-6 lg:p-8 border-b border-white/5" style={{ background: "linear-gradient(to right, rgba(16, 185, 129, 0.05), transparent)" }}>
            <h3 className="nm-heading flex items-center gap-3">
              <div className="nm-icon-circle nm-icon-circle--accent nm-icon-circle--sm">
                <Building2 size={16} />
              </div>
              Perfil da Empresa
            </h3>
            <p className="text-sm text-gray-400 mt-2 font-medium">Gerencie as informações básicas que aparecem nos orçamentos e relatórios.</p>
          </div>

          <form onSubmit={handleSaveCompany} className="p-6 lg:p-8 flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-14">
              <div className="space-y-2">
                <label className="nm-input-group__label">Nome Fantasia</label>
                <input
                  type="text"
                  value={company.name}
                  onChange={(e) => setCompany({ ...company, name: e.target.value })}
                  className="nm-input"
                  placeholder="Nome da sua empresa"
                />
              </div>
              <div className="space-y-2">
                <label className="nm-input-group__label">Contato / Telefone</label>
                <input
                  type="text"
                  value={company.contact}
                  onChange={(e) => setCompany({ ...company, contact: e.target.value })}
                  className="nm-input"
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="nm-input-group__label">Rua / Logradouro</label>
                <input
                  type="text"
                  value={company.street}
                  onChange={(e) => setCompany({ ...company, street: e.target.value })}
                  className="nm-input"
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:col-span-2">
                <div className="space-y-2">
                  <label className="nm-input-group__label">Número</label>
                  <input
                    type="text"
                    value={company.number}
                    onChange={(e) => setCompany({ ...company, number: e.target.value })}
                    className="nm-input"
                  />
                </div>
                <div className="space-y-2">
                  <label className="nm-input-group__label">Bairro</label>
                  <input
                    type="text"
                    value={company.neighborhood}
                    onChange={(e) => setCompany({ ...company, neighborhood: e.target.value })}
                    className="nm-input"
                  />
                </div>
                <div className="space-y-2">
                  <label className="nm-input-group__label">Cidade</label>
                  <input
                    type="text"
                    value={company.city}
                    onChange={(e) => setCompany({ ...company, city: e.target.value })}
                    className="nm-input"
                  />
                </div>
                <div className="space-y-2">
                  <label className="nm-input-group__label">Estado</label>
                  <input
                    type="text"
                    value={company.state}
                    onChange={(e) => setCompany({ ...company, state: e.target.value })}
                    className="nm-input"
                  />
                </div>
              </div>
            </div>
            <div 
              className="flex justify-end border-t border-white/5" 
              style={{ marginTop: '80px', paddingTop: '32px', paddingBottom: '32px' }}
            >
              <button
                type="submit"
                disabled={saving}
                className="nm-btn nm-btn--accent nm-btn--lg"
                style={{ 
                  background: "var(--nm-accent-color)", 
                  color: "white", 
                  boxShadow: "none", 
                  outline: "none" 
                }}
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                SALVAR ALTERAÇÕES
              </button>
            </div>
          </form>
        </div>
      )}

      {activeSection === "payments" && (
        <div className="nm-card nm-card--sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="p-6 lg:p-8 border-b border-white/5" style={{ background: "linear-gradient(to right, rgba(16, 185, 129, 0.05), transparent)" }}>
            <h3 className="nm-heading flex items-center gap-3">
              <div className="nm-icon-circle nm-icon-circle--accent nm-icon-circle--sm">
                <CreditCard size={16} />
              </div>
              Métodos de Pagamento
            </h3>
            <p className="text-sm text-gray-400 mt-2 font-medium">Configure as opções de pagamento disponíveis para suas vendas.</p>
          </div>

          <div className="p-6 lg:p-8 space-y-8">
            {/* Add New */}
            <div className="flex flex-col sm:flex-row gap-4 p-6 bg-black/20 border border-white/5 rounded-3xl">
              <div className="flex-1 space-y-2">
                <label className="nm-input-group__label">Nova Forma de Pagamento</label>
                <input
                  type="text"
                  value={newMethodName}
                  onChange={(e) => setNewMethodName(e.target.value)}
                  className="nm-input"
                  placeholder="Ex: Pix, Dinheiro, Cartão de Crédito..."
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleAddPaymentMethod}
                  disabled={saving || !newMethodName.trim()}
                  className="nm-btn nm-btn--accent"
                  style={{ height: "42px", background: "#3b82f6", color: "white" }}
                >
                  <Plus size={18} className="mr-1" />
                  ADICIONAR
                </button>
              </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paymentMethods.map((method) => (
                <div 
                  key={method.id}
                  className={`p-5 rounded-2xl border transition-all flex items-center justify-between group ${
                    method.active 
                      ? "bg-white/[0.02] border-white/10 hover:border-blue-500/50" 
                      : "bg-black/20 border-white/5 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`nm-icon-circle nm-icon-circle--xs ${method.active ? "nm-icon-circle--info border-blue-500/20" : "bg-white/5 text-gray-500 border-white/5"}`} style={method.active ? { background: "rgba(59,130,246,0.1)", color: "#3b82f6" } : {}}>
                      <CreditCard size={14} />
                    </div>
                    <span className="text-sm font-bold text-white">{method.name}</span>
                  </div>
                  
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => togglePaymentMethod(method)}
                      className={`nm-btn nm-btn--circle nm-btn--xs ${
                        method.active ? "nm-btn--danger" : "nm-btn--success"
                      }`}
                      title={method.active ? "Desativar" : "Ativar"}
                    >
                      {method.active ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
                    </button>
                  </div>
                </div>
              ))}

              {paymentMethods.length === 0 && (
                <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-white/5 rounded-3xl">
                  <CreditCard size={48} className="mb-4 opacity-20" />
                  <p className="nm-input-group__label">Nenhuma forma de pagamento cadastrada.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
