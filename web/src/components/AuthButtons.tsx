interface AuthButtonsProps {
  onSignInClick: () => void;
  onSignUpClick: () => void;
}

export function AuthButtons({ onSignInClick, onSignUpClick }: AuthButtonsProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "clamp(0.5rem, 2vw, 1rem)" }}>
      {/* Botão secundário neumórfico para acessar o login */}
      <button 
        type="button" 
        onClick={onSignInClick}
        className="nm-btn nm-btn--flat"
        style={{
          padding: "0.4rem clamp(0.6rem, 2vw, 1rem)",
          fontSize: "clamp(0.6rem, 2vw, 0.75rem)",
          fontWeight: 900,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        Entrar
      </button>

      {/* Botão principal com gradiente e glow turquesa para cadastro */}
      <button 
        type="button" 
        onClick={onSignUpClick}
        className="nm-btn nm-btn--accent"
        style={{
          padding: "0.4rem clamp(0.6rem, 2vw, 1rem)",
          fontSize: "clamp(0.6rem, 2vw, 0.75rem)",
          fontWeight: 900,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          whiteSpace: "nowrap",
        }}
      >
        Cadastrar<span className="nm-hide-sm">&nbsp;Empresa</span>
      </button>
    </div>
  );
}

