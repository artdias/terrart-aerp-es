"use client";

import React, { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface FilterSelectProps {
  name: string;
  defaultValue: string;
  options: { value: string; label: string }[];
  style?: React.CSSProperties;
}

export default function FilterSelect({ name, defaultValue, options, style }: FilterSelectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleChange = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val) {
      params.set(name, val);
    } else {
      params.delete(name);
    }

    startTransition(() => {
      router.replace(`?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <select
      value={defaultValue}
      onChange={(e) => handleChange(e.target.value)}
      style={{
        padding: "0.6rem 1rem",
        borderRadius: "6px",
        border: isPending ? "1px solid #3498db" : "1px solid #ddd",
        fontSize: "0.85rem",
        background: "white",
        outline: "none",
        cursor: "pointer",
        transition: "border-color 0.15s ease",
        ...style
      }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
