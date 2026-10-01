import { prisma } from "@/lib/prisma";

/**
 * Retorna o prefixo de setor padronizado em caixa alta (ex: TI, RH, FIN, OP, ADM, etc.)
 */
export function getSectorPrefix(departmentOrRole?: string | null): string {
  if (!departmentOrRole || !departmentOrRole.trim()) {
    return "GER";
  }

  const normalized = departmentOrRole
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();

  // Mapeamentos comuns
  if (normalized.includes("TI") || normalized.includes("TECNOLOGIA") || normalized.includes("INFORMATICA") || normalized.includes("SISTEMAS") || normalized.includes("DEV")) {
    return "TI";
  }
  if (normalized.includes("RH") || normalized.includes("RECURSOS HUMANOS") || normalized.includes("PESSOAL")) {
    return "RH";
  }
  if (normalized.includes("FINANC") || normalized.includes("CONTAB") || normalized.includes("TESOUR")) {
    return "FIN";
  }
  if (normalized.includes("OPER") || normalized.includes("SERVICO") || normalized.includes("CAMPO")) {
    return "OP";
  }
  if (normalized.includes("ADMIN") || normalized.includes("GERENC") || normalized.includes("DIRET")) {
    return "ADM";
  }
  if (normalized.includes("RECEP") || normalized.includes("ATEND")) {
    return "REC";
  }
  if (normalized.includes("MANUT") || normalized.includes("OBRA")) {
    return "MAN";
  }
  if (normalized.includes("PORTAR") || normalized.includes("SEGUR") || normalized.includes("VIGIL")) {
    return "SEG";
  }
  if (normalized.includes("LIMP") || normalized.includes("CONSERV")) {
    return "LIM";
  }
  if (normalized.includes("COMER") || normalized.includes("VEND")) {
    return "COM";
  }
  if (normalized.includes("JURID")) {
    return "JUR";
  }
  if (normalized.includes("ESTOQ") || normalized.includes("ALMOX")) {
    return "EST";
  }

  // Se não bater com nenhuma regra, pega as primeiras 2 a 3 letras limpas
  const clean = normalized.replace(/[^A-Z0-9]/g, "");
  if (clean.length >= 2) {
    return clean.slice(0, 3);
  }

  return "GER";
}

/**
 * Gera o próximo código de crachá único para um determinado setor (ex: TI-0001, RH-0002)
 */
export async function generateNextBadgeCode(department?: string | null): Promise<string> {
  const prefix = getSectorPrefix(department);

  // Buscar códigos existentes que começam com o prefixo no banco (User e Employee)
  const [users, employees] = await Promise.all([
    prisma.user.findMany({
      where: { badgeCode: { startsWith: `${prefix}-` } },
      select: { badgeCode: true }
    }),
    prisma.employee.findMany({
      where: { badgeCode: { startsWith: `${prefix}-` } },
      select: { badgeCode: true }
    })
  ]);

  const existingCodes = [
    ...users.map(u => u.badgeCode),
    ...employees.map(e => e.badgeCode)
  ].filter(Boolean) as string[];

  let maxNum = 0;
  for (const code of existingCodes) {
    const parts = code.split("-");
    if (parts.length >= 2) {
      const numPart = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    }
  }

  const nextNum = maxNum + 1;
  const formattedNum = String(nextNum).padStart(4, "0");
  return `${prefix}-${formattedNum}`;
}
