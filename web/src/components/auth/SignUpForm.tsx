"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Mail, Lock, X, User } from "lucide-react";

interface SignUpFormProps {
  onClose: () => void;
  onSignInClick: () => void;
}

export function SignUpForm({ onClose, onSignInClick }: SignUpFormProps) {
  const { login } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Password matching validation
  const passwordsMatch = password === confirmPassword && password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordsMatch) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001";
      
      // 1. Register Master User
      const regRes = await fetch(`${serverUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const regData = await regRes.json();
      if (!regRes.ok) throw new Error(regData.error || "Erro ao criar conta");

      // 2. Login immediately to get token
      const logRes = await fetch(`${serverUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const logData = await logRes.json();
      if (!logRes.ok) throw new Error(logData.error || "Erro ao autenticar");

      login(logData.token, logData.user, logData.tenant);
      
      router.push("/setup/personal");
    } catch (err: any) {
      console.error("Erro ao criar conta:", err);
      setError(err?.message || "Falha ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="nm-modal-backdrop" onClick={onClose}>
      <div 
        className="nm-modal nm-modal--sm"
        onClick={(e) => e.stopPropagation()}
        style={{ margin: "auto" }}
      >
        <div className="nm-modal__header" style={{ borderBottom: "none", paddingBottom: 0 }}>
          <div>
            <h2 className="nm-modal__title" style={{ textAlign: "center", width: "100%" }}>Criar Conta Business</h2>
            <p className="nm-modal__subtitle" style={{ textAlign: "center", width: "100%" }}>Inicie sua jornada no VendasPro</p>
          </div>
          <button 
            onClick={onClose}
            className="nm-modal__close"
            style={{ position: "absolute", top: "1rem", right: "1rem" }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="nm-modal__body" style={{ paddingTop: "1.5rem" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            
            <div className="nm-input-group">
              <label className="nm-input-group__label">Nome Completo</label>
              <div className="nm-input-group--with-icon">
                <div className="nm-input-group__icon">
                  <User size={16} />
                </div>
                <input 
                  type="text" 
                  required 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome" 
                  className="nm-input"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="nm-input-group">
              <label className="nm-input-group__label">E-mail profissional</label>
              <div className="nm-input-group--with-icon">
                <div className="nm-input-group__icon">
                  <Mail size={16} />
                </div>
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com" 
                  className="nm-input"
                  disabled={loading}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="nm-input-group">
                <label className="nm-input-group__label">Senha</label>
                <div className="nm-input-group--with-icon">
                  <div className="nm-input-group__icon">
                    <Lock size={16} />
                  </div>
                  <input 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="nm-input"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="nm-input-group">
                <label className="nm-input-group__label">Confirmar</label>
                <div className="nm-input-group--with-icon">
                  <div className="nm-input-group__icon">
                    <Lock size={16} />
                  </div>
                  <input 
                    type="password" 
                    required 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••" 
                    className={`nm-input ${confirmPassword && !passwordsMatch ? 'nm-input--error' : ''}`}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="nm-input-group__error" style={{ textAlign: "center", marginTop: "-0.5rem" }}>
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading || !passwordsMatch}
              className={`nm-btn nm-btn--accent nm-btn--block nm-btn--lg ${(loading || !passwordsMatch) ? 'nm-btn--disabled' : ''} ${loading ? 'nm-btn--loading' : ''}`}
              style={{ marginTop: "0.5rem" }}
            >
              Criar minha conta
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div style={{ marginTop: "2rem", textAlign: "center" }}>
            <p style={{ fontSize: "var(--nm-text-xs)", fontWeight: "var(--nm-font-bold)", textTransform: "uppercase", letterSpacing: "var(--nm-tracking-widest)", color: "var(--nm-text-muted)" }}>
              Já tem uma conta?{" "}
              <button 
                type="button" 
                onClick={onSignInClick} 
                style={{ color: "var(--nm-text-primary)", fontWeight: "var(--nm-font-black)", textDecoration: "none", cursor: "pointer", background: "none", border: "none" }}
              >
                Entrar
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
