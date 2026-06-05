"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Check, Search, X } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SearchableSelect({ 
  options, 
  value, 
  onChange, 
  placeholder = "Pesquisar...", 
  className = "",
  disabled = false
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Synchronize search with selected label when closed
  useEffect(() => {
    if (!isOpen) {
      setSearch("");
    }
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    if (!search) return options; // Retorna tudo se não houver busca
    return options.filter(opt => 
      opt.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [options, search]);

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
    <div className={`relative ${className} ${disabled ? "opacity-50 pointer-events-none" : ""}`} ref={containerRef} style={{ width: "100%" }}>
      {/* Trigger Button */}
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

      {/* Dropdown Menu */}
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
            boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.5)",
            border: "1px solid var(--nm-border-subtle)",
            marginBottom: 0
          }}
        >
          {/* Search Input */}
          <div style={{ paddingBottom: "0.5rem", marginBottom: "0.5rem", borderBottom: "1px solid var(--nm-border-subtle)" }}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
              <input
                autoFocus
                type="text"
                className="nm-input"
                style={{
                  width: "100%",
                  paddingLeft: "2.25rem",
                  paddingRight: "2rem",
                  fontSize: "var(--nm-text-sm)",
                  minHeight: "36px", // um pouco menor que o input normal
                }}
                placeholder="Pesquisar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button 
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[var(--nm-text-primary)]"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto custom-scrollbar" style={{ padding: "0.25rem" }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: "1.5rem", textAlign: "center", fontSize: "12px", color: "var(--nm-text-muted)", fontStyle: "italic" }}>
                Nenhum resultado encontrado
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                {filteredOptions.map((option) => {
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
        </div>
      )}
    </div>
  );
}
