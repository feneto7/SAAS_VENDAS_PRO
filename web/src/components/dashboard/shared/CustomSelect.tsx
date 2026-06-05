"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function CustomSelect({ options, value, onChange, placeholder = "Selecione...", className = "" }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef} style={{ width: "100%" }}>
      {/* Trigger Button - Estilo de nm-input */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="nm-input"
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          borderColor: isOpen ? "var(--nm-accent)" : "var(--nm-border)",
          boxShadow: isOpen ? "0 0 0 1px var(--nm-accent)" : "var(--nm-shadow-inner)",
          color: selectedOption ? "var(--nm-text-primary)" : "var(--nm-text-muted)",
        }}
      >
        <span style={{ fontSize: "var(--nm-text-sm)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          size={14} 
          style={{
            flexShrink: 0,
            transition: "transform 0.3s ease, color 0.3s ease",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            color: isOpen ? "var(--nm-accent)" : "var(--nm-text-muted)"
          }} 
        />
      </button>

      {/* Dropdown Menu - Estilo de nm-card flutuante */}
      {isOpen && (
        <div 
          className="nm-card nm-card--sm nm-animate-fade-in"
          style={{
            position: "absolute",
            zIndex: 100,
            top: "calc(100% + 0.5rem)",
            left: 0,
            width: "100%",
            padding: "0.5rem",
            maxHeight: "240px",
            overflowY: "auto",
            boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.5)",
            border: "1px solid var(--nm-border-subtle)",
            marginBottom: 0
          }}
        >
          {options.length === 0 ? (
            <div className="nm-caption" style={{ padding: "0.5rem", textAlign: "center", fontStyle: "italic" }}>
              Nenhuma opção disponível
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "0.5rem",
                      fontSize: "var(--nm-text-sm)",
                      transition: "all 0.15s ease",
                      cursor: "pointer",
                      backgroundColor: isSelected ? "var(--nm-accent-transparent)" : "transparent",
                      color: isSelected ? "var(--nm-accent)" : "var(--nm-text-primary)",
                      fontWeight: isSelected ? 700 : 500,
                      border: "none",
                      outline: "none"
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = "var(--nm-bg-elevated)";
                        e.currentTarget.style.color = "var(--nm-text-primary)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "var(--nm-text-primary)";
                      }
                    }}
                  >
                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {option.label}
                    </span>
                    {isSelected && <Check size={14} style={{ flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
