"use client";

import React, { useRef, useState, useEffect } from "react";
import { signDocument } from "@/actions/legalActions";
import { Edit3, CheckSquare, Trash2, ShieldCheck } from "lucide-react";

interface SignatureFormProps {
  documentId: string;
}

export default function SignatureForm({ documentId }: SignatureFormProps) {
  const [sigType, setSigType] = useState<"DRAWING" | "ELECTRONIC">("DRAWING");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [canvasIsEmpty, setCanvasIsEmpty] = useState(true);
  const [signatureData, setSignatureData] = useState("");

  // Configurações do canvas para desenho
  useEffect(() => {
    if (sigType !== "DRAWING") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#2c3e50";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [sigType]);

  // Funções de desenho (Mouse)
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();

    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
    setCanvasIsEmpty(false);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    saveCanvasData();
  };

  // Funções de desenho (Touch/Celular)
  const startDrawingTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];

    ctx.beginPath();
    ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
    setIsDrawing(true);
    setCanvasIsEmpty(false);
  };

  const drawTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];

    ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
    ctx.stroke();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setCanvasIsEmpty(true);
    setSignatureData("");
  };

  const saveCanvasData = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSignatureData(canvas.toDataURL("image/png"));
  };

  return (
    <form action={signDocument} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <input type="hidden" name="documentId" value={documentId} />
      <input type="hidden" name="signatureType" value={sigType} />

      {/* Seletor de Tipo de Assinatura */}
      <div style={{ display: "flex", background: "#f1f2f6", borderRadius: "8px", padding: "4px" }}>
        <button
          type="button"
          onClick={() => setSigType("DRAWING")}
          style={{
            flex: 1,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            border: "none",
            borderRadius: "6px",
            padding: "10px",
            fontSize: "0.9rem",
            fontWeight: 600,
            cursor: "pointer",
            background: sigType === "DRAWING" ? "white" : "transparent",
            color: sigType === "DRAWING" ? "#003366" : "#777",
            boxShadow: sigType === "DRAWING" ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
            transition: "all 0.2s"
          }}
        >
          <Edit3 size={16} /> Desenhar Assinatura
        </button>
        <button
          type="button"
          onClick={() => setSigType("ELECTRONIC")}
          style={{
            flex: 1,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            border: "none",
            borderRadius: "6px",
            padding: "10px",
            fontSize: "0.9rem",
            fontWeight: 600,
            cursor: "pointer",
            background: sigType === "ELECTRONIC" ? "white" : "transparent",
            color: sigType === "ELECTRONIC" ? "#003366" : "#777",
            boxShadow: sigType === "ELECTRONIC" ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
            transition: "all 0.2s"
          }}
        >
          <CheckSquare size={16} /> Confirmação por CPF
        </button>
      </div>

      {/* Área de Desenho */}
      {sigType === "DRAWING" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "#333" }}>Assine dentro do quadro abaixo:</label>
          <div style={{ border: "2px dashed #ccc", borderRadius: "8px", background: "#fcfcfc", overflow: "hidden", position: "relative" }}>
            <canvas
              ref={canvasRef}
              width={500}
              height={180}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawingTouch}
              onTouchMove={drawTouch}
              onTouchEnd={stopDrawing}
              style={{ display: "block", cursor: "crosshair", touchAction: "none", width: "100%" }}
            />
            {canvasIsEmpty && (
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", color: "#bbb", fontSize: "0.9rem", pointerEvents: "none", userSelect: "none" }}>
                Use o dedo ou mouse para assinar aqui
              </div>
            )}
          </div>
          <input type="hidden" name="signatureImage" value={signatureData} />
          
          <button
            type="button"
            onClick={clearCanvas}
            style={{
              alignSelf: "flex-end",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              background: "none",
              border: "none",
              color: "#c0392b",
              cursor: "pointer",
              fontSize: "0.8rem",
              fontWeight: 600
            }}
          >
            <Trash2 size={14} /> Limpar Quadro
          </button>
        </div>
      ) : (
        /* Área de Confirmação por CPF */
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "#fcfcfc", border: "1px solid #eee", padding: "1.2rem", borderRadius: "8px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "#333" }}>Nome Completo <span style={{ color: '#e74c3c' }}>*</span></label>
            <input
              type="text"
              name="signerName"
              placeholder="Digite seu nome conforme documento..."
              required={sigType === "ELECTRONIC"}
              style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "0.9rem" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "#333" }}>Confirmar CPF <span style={{ color: '#e74c3c' }}>*</span></label>
            <input
              type="text"
              name="signerCpf"
              placeholder="000.000.000-00"
              required={sigType === "ELECTRONIC"}
              style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "0.9rem" }}
            />
          </div>
        </div>
      )}

      {/* Botão de Envio */}
      <button
        type="submit"
        disabled={sigType === "DRAWING" && canvasIsEmpty}
        style={{
          background: sigType === "DRAWING" && canvasIsEmpty ? "#bdc3c7" : "#27ae60",
          color: "white",
          border: "none",
          padding: "12px",
          borderRadius: "8px",
          cursor: sigType === "DRAWING" && canvasIsEmpty ? "not-allowed" : "pointer",
          fontWeight: 700,
          fontSize: "1rem",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          transition: "background 0.2s"
        }}
      >
        <ShieldCheck size={20} />
        Confirmar Assinatura Digital
      </button>
    </form>
  );
}
