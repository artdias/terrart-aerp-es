"use client";

import { payExpense } from "@/actions/expenseActions";
import React from "react";

interface PayExpenseFormProps {
  expenseId: string;
}

export default function PayExpenseForm({ expenseId }: PayExpenseFormProps) {
  return (
    <form action={payExpense} encType="multipart/form-data" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <input type="hidden" name="expenseId" value={expenseId} />
      <label 
        htmlFor={`receipt-${expenseId}`} 
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
        id={`receipt-${expenseId}`} 
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
