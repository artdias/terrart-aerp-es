"use client";

import React, { useRef, useState } from "react";
import { payClientBilling } from "@/actions/billingActions";
import { FileUp, Loader2 } from "lucide-react";

export default function PayBillingForm({ billingId }: { billingId: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("billingId", billingId);
      formData.append("attachment", file);

      await payClientBilling(formData);
    } catch (err: any) {
      alert(err.message || "Erro ao fazer upload do comprovante.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div style={{ display: "inline-flex", alignItems: "center" }}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
        accept=".pdf,.png,.jpg,.jpeg"
      />
      <button
        type="button"
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          background: "#27ae60",
          color: "white",
          border: "none",
          padding: "6px 12px",
          borderRadius: "4px",
          fontSize: "0.8rem",
          fontWeight: 600,
          cursor: "pointer",
          transition: "background 0.2s"
        }}
        onMouseOver={(e) => (e.currentTarget.style.background = "#219653")}
        onMouseOut={(e) => (e.currentTarget.style.background = "#27ae60")}
      >
        {isUploading ? (
          <>
            <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
            <span>Enviando...</span>
          </>
        ) : (
          <>
            <FileUp size={14} />
            <span>Anexar Comprovante</span>
          </>
        )}
      </button>
      
      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
