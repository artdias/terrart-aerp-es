"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronUp, ChevronDown } from "lucide-react";

interface SortableHeaderProps {
  label: string;
  value: string;
}

export default function SortableHeader({ label, value }: SortableHeaderProps) {
  const searchParams = useSearchParams();
  
  const currentSortBy = searchParams.get("sortBy") || "createdAt";
  const currentOrder = searchParams.get("order") || "desc";

  const isCurrentSort = currentSortBy === value;
  
  // Se já está ordenando por essa coluna e for asc, muda pra desc. 
  // Caso contrário (se é desc ou se clicou em outra coluna), muda pra asc.
  const nextOrder = isCurrentSort && currentOrder === "asc" ? "desc" : "asc";

  const params = new URLSearchParams(searchParams.toString());
  params.set("sortBy", value);
  params.set("order", nextOrder);

  return (
    <Link
      href={`?${params.toString()}`}
      scroll={false}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        cursor: "pointer",
        color: "inherit",
        textDecoration: "none",
        userSelect: "none",
      }}
      title={`Ordenar por ${label}`}
    >
      {label}
      {isCurrentSort ? (
        currentOrder === "asc" ? (
          <ChevronUp size={16} />
        ) : (
          <ChevronDown size={16} />
        )
      ) : (
        <span style={{ opacity: 0.3 }}>
          <ChevronDown size={16} />
        </span>
      )}
    </Link>
  );
}
