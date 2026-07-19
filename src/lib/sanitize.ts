/**
 * Utilitários de higienização de inputs para proteção contra SQL Injection e XSS.
 */

export function sanitizeInput(value: string | null | undefined): string {
  if (!value) return "";
  
  const str = String(value).trim();
  
  // 1. Detectar padrões suspeitos de SQL Injection e comandos SQL comuns
  const sqlInjectionPattern = /\b(UNION\s+SELECT|SELECT\s+.*?\s+FROM|INSERT\s+INTO|UPDATE\s+.*?\s+SET|DELETE\s+FROM|DROP\s+TABLE|DROP\s+DATABASE|ALTER\s+TABLE|OR\s+['"]?\d+['"]?\s*=\s*['"]?\d+|AND\s+['"]?\d+['"]?\s*=\s*['"]?\d+|UNION\s+ALL|--|#|\/\*|\*\/)\b/gi;
  if (sqlInjectionPattern.test(str)) {
    throw new Error("Comando ou caractere proibido detectado no formulário (SQL Injection).");
  }

  // 2. Detectar e bloquear tags script ou scripts inline (XSS)
  if (/<script[^>]*>([\s\S]*?)<\/script>/gi.test(str) || /javascript:/i.test(str) || /onload=/i.test(str) || /onerror=/i.test(str)) {
    throw new Error("Código script ou comando proibido detectado.");
  }
  
  // 3. Remover quaisquer tags HTML residuais
  const cleanStr = str.replace(/<\/?[^>]+(>|$)/g, "");
  
  return cleanStr;
}

/**
 * Higieniza um objeto completo cujos valores sejam strings.
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = {} as any;
  for (const key in obj) {
    if (typeof obj[key] === "string") {
      sanitized[key] = sanitizeInput(obj[key]);
    } else {
      sanitized[key] = obj[key];
    }
  }
  return sanitized;
}
