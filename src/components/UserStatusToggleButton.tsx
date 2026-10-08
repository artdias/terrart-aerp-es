"use client";

import React from "react";
import { UserX, UserCheck } from "lucide-react";

interface UserStatusToggleButtonProps {
  action: (formData: FormData) => Promise<any>;
  userId: string;
  active: boolean;
  userName: string;
}

export default function UserStatusToggleButton({
  action,
  userId,
  active,
  userName,
}: UserStatusToggleButtonProps) {
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const actionText = active
      ? `Deseja inativar o usuário "${userName}"? O acesso deste usuário ao sistema será bloqueado.`
      : `Deseja reativar o usuário "${userName}"? O acesso deste usuário ao sistema será liberado.`;

    if (!window.confirm(actionText)) return;

    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      const result = await action(formData);

      if (result && result.error) {
        alert(result.error);
      }
    } catch (error: any) {
      alert("Ocorreu um erro ao tentar alterar o status do usuário.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "inline" }}>
      <input type="hidden" name="userId" value={userId} />
      <button
        type="submit"
        disabled={loading}
        title={active ? "Inativar / Bloquear Usuário" : "Reativar / Desbloquear Usuário"}
        style={{
          background: loading
            ? "#e2e8f0"
            : active
            ? "#fff7ed"
            : "#f0fdf4",
          color: loading
            ? "#94a3b8"
            : active
            ? "#c2410c"
            : "#15803d",
          border: `1px solid ${
            loading
              ? "#cbd5e1"
              : active
              ? "#ffedd5"
              : "#bbf7d0"
          }`,
          padding: "6px 12px",
          borderRadius: "6px",
          fontSize: "0.85rem",
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          transition: "all 0.2s"
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.currentTarget.style.background = active ? "#ffedd5" : "#dcfce7";
          }
        }}
        onMouseLeave={(e) => {
          if (!loading) {
            e.currentTarget.style.background = active ? "#fff7ed" : "#f0fdf4";
          }
        }}
      >
        {active ? <UserX size={14} /> : <UserCheck size={14} />}
        {loading
          ? "Salvando..."
          : active
          ? "Inativar"
          : "Ativar"}
      </button>
    </form>
  );
}
