"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Mail, Lock, X } from "lucide-react";

interface SignInFormProps {
  onClose: () => void;
  onSignUpClick: () => void;
}

export function SignInForm({ onClose, onSignUpClick }: SignInFormProps) {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001";
      const res = await fetch(`${serverUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao fazer login");
      }

      login(data.token, data.user, data.tenant);
      
      onClose();
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Erro ao fazer login:", err);
      setError(err?.message || "E-mail ou senha inválidos.");
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
            <h2 className="nm-modal__title" style={{ textAlign: "center", width: "100%" }}>Bem-vindo de Volta</h2>
            <p className="nm-modal__subtitle" style={{ textAlign: "center", width: "100%" }}>Acesse sua conta VendasPro</p>
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
              <label className="nm-input-group__label">Seu E-mail</label>
              <div className="nm-input-group--with-icon">
                <div className="nm-input-group__icon">
                  <Mail size={16} />
                </div>
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@email.com" 
                  className="nm-input"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="nm-input-group">
              <label className="nm-input-group__label">Sua Senha</label>
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

            {error && (
              <div className="nm-input-group__error" style={{ textAlign: "center", marginTop: "-0.5rem" }}>
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className={`nm-btn nm-btn--accent nm-btn--block nm-btn--lg ${loading ? 'nm-btn--loading' : ''}`}
              style={{ marginTop: "0.5rem" }}
            >
              Entrar na Plataforma
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div style={{ marginTop: "2rem", textAlign: "center" }}>
            <p style={{ fontSize: "var(--nm-text-xs)", fontWeight: "var(--nm-font-bold)", textTransform: "uppercase", letterSpacing: "var(--nm-tracking-widest)", color: "var(--nm-text-muted)" }}>
              Não tem uma conta?{" "}
              <button 
                type="button" 
                onClick={onSignUpClick} 
                style={{ color: "var(--nm-text-primary)", fontWeight: "var(--nm-font-black)", textDecoration: "none", cursor: "pointer", background: "none", border: "none" }}
              >
                Cadastrar Empresa
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
