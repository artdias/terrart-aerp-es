"use client";

import { payInvoice } from "@/actions/financeActions";
import React, { useState } from "react";
import { Check } from "lucide-react";

interface PayInvoiceFormProps {
  invoiceId: string;
}

export default function PayInvoiceForm({ invoiceId }: PayInvoiceFormProps) {
  const [loading, setLoading] = useState(false);

  const handleMarkAsPaid = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("invoiceId", invoiceId);
      formData.set("paidAt", new Date().toISOString().split("T")[0]);
      await payInvoice(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleMarkAsPaid}
      disabled={loading}
      style={{
        background: "#27ae60",
        color: "white",
        border: "1px solid #27ae60",
        padding: "5px 10px",
        borderRadius: "6px",
        cursor: loading ? "not-allowed" : "pointer",
        fontWeight: 600,
        fontSize: "0.8rem",
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        transition: "all 0.2s"
      }}
    >
      <Check size={14} />
      {loading ? "Salvando..." : "Marcar como Pago"}
    </button>
  );
}
