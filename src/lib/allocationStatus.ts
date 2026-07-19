export function getAllocationStatus(allocation: {
  status: string;
  startDate?: Date | null;
  endDate?: Date | null;
  concludedAt?: Date | null;
}) {
  // Se estiver cancelada manualmente, mantemos o status
  if (allocation.status === "Cancelada") {
    return "Cancelada";
  }

  // Se foi concluída pelo botão
  if (allocation.concludedAt) {
    if (allocation.endDate && allocation.concludedAt < allocation.endDate) {
      return "Incompleto";
    }
    return "Concluída";
  }

  // Se não foi concluída, verificamos se a data prevista já passou
  if (allocation.endDate && allocation.endDate < new Date()) {
    return "Expirado";
  }

  return "Ativa";
}
