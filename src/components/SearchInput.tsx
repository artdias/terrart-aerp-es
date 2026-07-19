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

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      const currentVal = searchParams.get(name) || "";
      if (value === currentVal) return; // Evita navegações redundantes

      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }

      startTransition(() => {
        router.replace(`?${params.toString()}`, { scroll: false });
      });
    }, 200); // Debounce de 200ms para evitar requisições em excesso ao banco

    return () => clearTimeout(delayDebounce);
  }, [value, name, router, searchParams]);

  // Sincronizar o valor local caso os filtros sejam limpos externamente
  const externalVal = searchParams.get(name) || "";
  if (externalVal !== value && value !== "" && externalVal === "") {
    setValue("");
  }

  return (
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
  );
}
