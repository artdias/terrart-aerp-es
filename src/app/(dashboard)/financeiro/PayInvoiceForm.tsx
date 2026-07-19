"use client";

import { payInvoice } from "@/actions/financeActions";
import React from "react";

interface PayInvoiceFormProps {
  invoiceId: string;
}

export default function PayInvoiceForm({ invoiceId }: PayInvoiceFormProps) {
  return (
    <form action={payInvoice} encType="multipart/form-data" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <label 
        htmlFor={`receipt-${invoiceId}`} 
        style={{ 
          background: '#27ae60', 
          color: 'white', 
          border: '1px solid #27ae60',
          padding: '5px 10px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: '0.8rem',
          display: 'inline-block',
          transition: 'all 0.2s'
        }}
      >
        Dar Baixa
      </label>
      <input 
        type="file" 
        id={`receipt-${invoiceId}`} 
        name="receipt" 
        required
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files?.length) {
            e.target.form?.requestSubmit();
          }
        }}
      />
    </form>
  );
}
