"use client";

import { useState } from "react";
import { Printer } from "lucide-react";

interface PrintFichaVaziaButtonProps {
  className?: string;
}

export default function PrintFichaVaziaButton({ className }: PrintFichaVaziaButtonProps) {
  const [isPending, setIsPending] = useState(false);

  const handlePrint = () => {
    setIsPending(true);

    // Tenta primeiro abrir através de um iframe oculto para não alterar a página atual
    let iframe = document.getElementById("print-ficha-vazia-iframe") as HTMLIFrameElement;
    
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.id = "print-ficha-vazia-iframe";
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      document.body.appendChild(iframe);
    }

    iframe.onload = () => {
      setIsPending(false);
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (err) {
          console.warn("Disparo por iframe falhou. Abrindo janela de impressão alternativa...", err);
          window.open("/funcionarios/ficha-vazia", "_blank");
        }
      }, 150);
    };

    iframe.src = "/funcionarios/ficha-vazia";

    // Timeout de segurança para destravar o botão caso o evento onload demore
    setTimeout(() => {
      setIsPending(false);
    }, 4000);
  };

  return (
    <button
      type="button"
      onClick={handlePrint}
      disabled={isPending}
      className={className}
      style={{
        background: "#3b82f6",
        color: "white",
        border: "none",
        padding: "10px 16px",
        borderRadius: "8px",
        fontSize: "0.9rem",
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        gap: "8px",
        cursor: isPending ? "wait" : "pointer"
      }}
    >
      <Printer size={20} />
      <span>{isPending ? "Carregando..." : "Imprimir Ficha Vazia"}</span>
    </button>
  );
}
