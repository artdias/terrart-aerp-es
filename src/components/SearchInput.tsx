"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface SearchInputProps {
  placeholder: string;
  name?: string;
  style?: React.CSSProperties;
}

export default function SearchInput({ placeholder, name = "search", style }: SearchInputProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get(name) || "");
  const [isPending, startTransition] = useTransition();

  // Atualiza o state local se o parâmetro na URL mudar externamente (ex: botão de limpar filtros)
  useEffect(() => {
    const currentVal = searchParams.get(name) || "";
    setValue(currentVal);
  }, [searchParams, name]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    
    if (value.trim()) {
      params.set(name, value.trim());
    } else {
      params.delete(name);
    }

    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <form 
      onSubmit={handleSearch} 
      style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, padding: 0 }}
    >
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{
          padding: "0.6rem 1rem",
          borderRadius: "6px",
          border: isPending ? "1px solid #3498db" : "1px solid #ddd",
          minWidth: "240px",
          fontSize: "0.85rem",
          outline: "none",
          transition: "border-color 0.15s ease",
          ...style
        }}
      />
      <button
        type="submit"
        disabled={isPending}
        style={{
          padding: "0.6rem 1rem",
          borderRadius: "6px",
          border: "none",
          background: "#3498db",
          color: "white",
          fontWeight: 600,
          cursor: isPending ? "not-allowed" : "pointer",
          opacity: isPending ? 0.7 : 1,
          transition: "opacity 0.15s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        Buscar
      </button>
    </form>
  );
}
