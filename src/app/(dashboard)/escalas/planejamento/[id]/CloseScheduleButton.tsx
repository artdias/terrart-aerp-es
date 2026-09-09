"use client";
import { useState } from "react";
import { closeSchedule, reopenSchedule } from "@/actions/scheduleGeneratorActions";
import { useRouter } from "next/navigation";
import { CheckCircle, Unlock } from "lucide-react";

export default function CloseScheduleButton({ scheduleId, currentStatus, competencyMonth, workplaceId }: { scheduleId: string, currentStatus: string, competencyMonth: string, workplaceId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleReopen() {
    if (!confirm("Deseja reabrir esta escala para edições?")) return;
    setLoading(true);
    try {
      await reopenSchedule(scheduleId);
      router.refresh();
    } catch (err: any) {
      alert("Erro ao reabrir: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  if (currentStatus === "ENCERRADA") {
     return (
       <div className="hide-on-print" style={{ display: 'flex', gap: '8px' }}>
        <button disabled={loading} onClick={handleReopen} style={{ padding: "8px 16px", backgroundColor: "#f59e0b", color: "white", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
          <Unlock size={18} />
          {loading ? "Reabrindo..." : "Reabrir Escala"}
        </button>
        <button onClick={() => router.push(`/escalas/fechamento?month=${competencyMonth}&workplaceId=${workplaceId}`)} style={{ padding: "8px 16px", backgroundColor: "#10b981", color: "white", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
          <CheckCircle size={18} />
          Ver Fechamento
        </button>
       </div>
     );
  }

  async function handleClose() {
    if (!confirm("Deseja encerrar esta escala? Ao encerrar, você será redirecionado para a consolidação e fechamento mensal e a escala será bloqueada para edições.")) return;
    setLoading(true);
    try {
      await closeSchedule(scheduleId);
      router.push(`/escalas/fechamento?month=${competencyMonth}&workplaceId=${workplaceId}`);
    } catch (err: any) {
      alert("Erro ao encerrar: " + err.message);
      setLoading(false);
    }
  }

  return (
    <button 
      onClick={handleClose} 
      disabled={loading}
      className="hide-on-print"
      style={{ padding: "8px 16px", backgroundColor: "#3b82f6", color: "white", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}
    >
      <CheckCircle size={18} />
      {loading ? "Processando..." : "Fechar Escala"}
    </button>
  );
}