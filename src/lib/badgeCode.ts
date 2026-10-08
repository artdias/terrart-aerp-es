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
 * Gera um código de crachá único e aleatório não-sequencial para um determinado setor (ex: TI-7492, REC-3184).
 * Isso evita que pessoas externas deduza o número exato de funcionários da empresa.
 */
export async function generateNextBadgeCode(department?: string | null): Promise<string> {
  const prefix = getSectorPrefix(department);

  // Buscar todos os códigos existentes no banco (User e Employee) para garantia de unicidade absoluta
  const [users, employees] = await Promise.all([
    prisma.user.findMany({ select: { badgeCode: true } }),
    prisma.employee.findMany({ select: { badgeCode: true } })
  ]);

  const existingCodes = new Set<string>([
    ...users.map(u => u?.badgeCode).filter(Boolean),
    ...employees.map(e => e?.badgeCode).filter(Boolean)
  ] as string[]);

  let attempts = 0;
  while (attempts < 1000) {
    // Número aleatório não-sequencial entre 1000 e 9999
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const candidateCode = `${prefix}-${randomNum}`;
    
    if (!existingCodes.has(candidateCode)) {
      return candidateCode;
    }
    attempts++;
  }

  // Fallback para maior amplitude se houver muitas colisões: 5 dígitos aleatórios
  const randomNum5 = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${randomNum5}`;
}
