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
    <div className="space-y-6">
      {/* Header Tabs */}
      <div className="flex gap-4 p-1 bg-white/5 rounded-2xl w-fit border border-white/10">
        <button
          onClick={() => setActiveSection("company")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeSection === "company" 
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20" 
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Building2 size={18} />
          Dados da Empresa
        </button>
        <button
          onClick={() => setActiveSection("payments")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeSection === "payments" 
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20" 
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <CreditCard size={18} />
          Formas de Pagamento
        </button>
      </div>

      {activeSection === "company" && company && (
        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="p-6 lg:p-8 border-b border-white/10 bg-gradient-to-r from-purple-600/10 to-transparent">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Building2 className="text-purple-400" />
              Perfil da Empresa
            </h3>
            <p className="text-sm text-gray-400 mt-1">Gerencie as informações básicas que aparecem nos orçamentos e relatórios.</p>
          </div>

          <form onSubmit={handleSaveCompany} className="p-6 lg:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Nome Fantasia</label>
                <input
                  type="text"
                  value={company.name}
                  onChange={(e) => setCompany({ ...company, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Nome da sua empresa"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Contato / Telefone</label>
                <input
                  type="text"
                  value={company.contact}
                  onChange={(e) => setCompany({ ...company, contact: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Rua / Logradouro</label>
                <input
                  type="text"
                  value={company.street}
                  onChange={(e) => setCompany({ ...company, street: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:col-span-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Número</label>
                  <input
                    type="text"
                    value={company.number}
                    onChange={(e) => setCompany({ ...company, number: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Bairro</label>
                  <input
                    type="text"
                    value={company.neighborhood}
                    onChange={(e) => setCompany({ ...company, neighborhood: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Cidade</label>
                  <input
                    type="text"
                    value={company.city}
                    onChange={(e) => setCompany({ ...company, city: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Estado</label>
                  <input
                    type="text"
                    value={company.state}
                    onChange={(e) => setCompany({ ...company, state: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving}
                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold px-8 py-4 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-purple-600/20 active:scale-95"
              >
                {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                SALVAR ALTERAÇÕES
              </button>
            </div>
          </form>
        </div>
      )}

      {activeSection === "payments" && (
        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="p-6 lg:p-8 border-b border-white/10 bg-gradient-to-r from-blue-600/10 to-transparent">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <CreditCard className="text-blue-400" />
              Métodos de Pagamento
            </h3>
            <p className="text-sm text-gray-400 mt-1">Configure as opções de pagamento disponíveis para suas vendas.</p>
          </div>

          <div className="p-6 lg:p-8 space-y-8">
            {/* Add New */}
            <div className="flex flex-col sm:flex-row gap-4 p-6 bg-white/5 border border-white/10 rounded-3xl">
              <div className="flex-1 space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Nova Forma de Pagamento</label>
                <input
                  type="text"
                  value={newMethodName}
                  onChange={(e) => setNewMethodName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Ex: Pix, Dinheiro, Cartão de Crédito..."
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleAddPaymentMethod}
                  disabled={saving || !newMethodName.trim()}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold h-[50px] px-8 rounded-2xl flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-600/20"
                >
                  <Plus size={20} />
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
                      ? "bg-white/5 border-white/10 hover:border-blue-500/50" 
                      : "bg-black/20 border-white/5 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${method.active ? "bg-blue-500/20 text-blue-400" : "bg-gray-500/20 text-gray-500"}`}>
                      <CreditCard size={18} />
                    </div>
                    <span className="font-semibold">{method.name}</span>
                  </div>
                  
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => togglePaymentMethod(method)}
                      className={`p-2 rounded-lg transition-colors ${
                        method.active ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" : "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                      }`}
                    >
                      {method.active ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                    </button>
                  </div>
                </div>
              ))}

              {paymentMethods.length === 0 && (
                <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-white/5 rounded-3xl">
                  <CreditCard size={48} className="mb-4 opacity-20" />
                  <p>Nenhuma forma de pagamento cadastrada.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
