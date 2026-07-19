"use client";

import { returnEquipment } from "@/actions/equipmentActions";
import React from "react";

interface ReturnMaterialFormProps {
  equipmentId: string;
}

export default function ReturnMaterialForm({ equipmentId }: ReturnMaterialFormProps) {
  return (
    <form 
      action={returnEquipment} 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '6px', 
        background: '#fcfcfc', 
        padding: '8px', 
        borderRadius: '8px', 
        border: '1px solid #e0e0e0',
        maxWidth: '280px'
      }}
    >
      <input type="hidden" name="equipmentId" value={equipmentId} />
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#555' }}>Tipo de Baixa <span style={{ color: '#e74c3c' }}>*</span></label>
        <select 
          name="status" 
          required 
          style={{ 
            padding: '5px', 
            borderRadius: '4px', 
            border: '1px solid #ccc', 
            fontSize: '0.8rem', 
            background: 'white' 
          }}
        >
          <option value="DEVOLVIDO">Devolver ao Estoque (ex: Escada, Uniforme)</option>
          <option value="CONSUMIDO">Consumido / Gasto (ex: Cloro, Detergente)</option>
          <option value="DANIFICADO">Danificado / Manutenção</option>
          <option value="PERDIDO">Perdido / Extraviado</option>
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <input 
          type="text" 
          name="returnObservations" 
          placeholder="Obs. de retorno/baixa..." 
          maxLength={150}
          style={{ 
            padding: '5px', 
            borderRadius: '4px', 
            border: '1px solid #ccc', 
            fontSize: '0.8rem' 
          }}
        />
      </div>

      <button 
        type="submit" 
        style={{ 
          background: '#27ae60', 
          color: 'white', 
          border: 'none', 
          padding: '6px 10px', 
          borderRadius: '4px', 
          cursor: 'pointer', 
          fontWeight: 600,
          fontSize: '0.8rem',
          textAlign: 'center',
          transition: 'background 0.2s'
        }}
        onMouseOver={(e) => (e.currentTarget.style.background = '#219653')}
        onMouseOut={(e) => (e.currentTarget.style.background = '#27ae60')}
      >
        Dar Baixa
      </button>
    </form>
  );
}

