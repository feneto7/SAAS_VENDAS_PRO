"use client";

import { useTheme } from "./ThemeProvider";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function ThemeToggle({ size = "md", showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme, isDark } = useTheme();

  const sizeClass = {
    sm: "nm-btn--circle nm-btn--sm",
    md: "nm-btn--circle",
    lg: "nm-btn--circle nm-btn--lg",
  }[size];

  const iconSize = { sm: 14, md: 18, lg: 22 }[size];

  return (
    <button
      className={`nm-btn ${sizeClass} ${isDark ? "" : "nm-btn--glow"}`}
      onClick={toggleTheme}
      title={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
      aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
      id="theme-toggle-btn"
    >
      {isDark ? (
        <Sun
          size={iconSize}
          style={{ color: "var(--nm-text-secondary)", transition: "all var(--nm-transition)" }}
        />
      ) : (
        <Moon
          size={iconSize}
          style={{ color: "var(--nm-accent)", transition: "all var(--nm-transition)" }}
        />
      )}

      {showLabel && (
        <span style={{ fontSize: "var(--nm-text-sm)", fontWeight: 600, color: "var(--nm-text-secondary)" }}>
          {isDark ? "Claro" : "Escuro"}
        </span>
      )}
    </button>
  );
}
