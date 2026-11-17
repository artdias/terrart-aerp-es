import React from "react";

interface WhatsAppButtonProps {
  phone?: string | null;
  name?: string | null;
  label?: string;
  showNumber?: boolean;
  size?: "sm" | "md";
  message?: string;
  style?: React.CSSProperties;
}

export function formatWhatsAppUrl(phone?: string | null, message?: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return null;

  // Se for número brasileiro sem DDI (10 ou 11 dígitos), adiciona 55
  const fullNumber =
    digits.length >= 10 && digits.length <= 11 && !digits.startsWith("55")
      ? `55${digits}`
      : digits;

  const baseUrl = `https://wa.me/${fullNumber}`;
  if (message) {
    return `${baseUrl}?text=${encodeURIComponent(message)}`;
  }
  return baseUrl;
}

export default function WhatsAppButton({
  phone,
  name,
  label = "WhatsApp",
  showNumber = false,
  size = "sm",
  message,
  style,
}: WhatsAppButtonProps) {
  const url = formatWhatsAppUrl(phone, message);

  if (!url || !phone) {
    return null;
  }

  const isSmall = size === "sm";

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={`Abrir conversa no WhatsApp${name ? ` com ${name}` : ""} (${phone})`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: isSmall ? "5px" : "6px",
        background: "#25D366",
        color: "#ffffff",
        textDecoration: "none",
        padding: isSmall ? "4px 10px" : "7px 14px",
        borderRadius: "6px",
        fontSize: isSmall ? "0.78rem" : "0.86rem",
        fontWeight: 700,
        boxShadow: "0 1px 3px rgba(37, 211, 102, 0.3)",
        whiteSpace: "nowrap",
        lineHeight: 1.2,
        ...style,
      }}
    >
      <svg
        width={isSmall ? 14 : 16}
        height={isSmall ? 14 : 16}
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <path d="M12.031 2C6.508 2 2.023 6.485 2.023 12.008c0 1.766.461 3.49 1.337 5.01L2 22l5.122-1.343a9.968 9.968 0 0 0 4.909 1.298h.004c5.522 0 10.007-4.485 10.007-10.007C22.042 6.485 17.553 2 12.031 2zm5.829 14.129c-.246.693-1.434 1.326-1.988 1.411-.51.078-1.155.111-1.868-.115-.434-.137-.99-.322-1.703-.63-2.996-1.293-4.953-4.312-5.103-4.512-.149-.199-1.218-1.621-1.218-3.092 0-1.471.771-2.194 1.045-2.493.274-.299.598-.374.797-.374.199 0 .398.002.573.01.184.009.43-.07.673.514.249.599.847 2.069.922 2.219.075.15.125.324.025.524-.1.199-.15.324-.299.499-.15.174-.314.389-.449.524-.15.149-.306.311-.131.61.174.299.774 1.277 1.662 2.069 1.142 1.018 2.104 1.334 2.403 1.483.299.15.474.125.649-.075.174-.199.748-.872.947-1.171.199-.299.399-.249.673-.15.274.1 1.745.823 2.044.972.299.15.499.224.573.349.075.125.075.723-.171 1.416z" />
      </svg>
      <span>{showNumber ? phone : label}</span>
    </a>
  );
}
