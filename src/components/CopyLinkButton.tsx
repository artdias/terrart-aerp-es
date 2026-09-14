"use client";

import { useState } from "react";
import { Link as LinkIcon, Check } from "lucide-react";

export default function CopyLinkButton({ url, label, style, icon: Icon = LinkIcon }: { url: string, label: string, style?: any, icon?: any }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const fullUrl = window.location.origin + url;
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Falha ao copiar", err);
    }
  };

  return (
    <button 
      onClick={handleCopy} 
      style={{ ...style, cursor: 'pointer', border: 'none', fontFamily: 'inherit' }}
      title="Copiar link"
    >
      {copied ? <Check size={20} /> : <Icon size={20} />}
      <span>{copied ? "Link Copiado!" : label}</span>
    </button>
  );
}
