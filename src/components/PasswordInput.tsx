"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps {
  id?: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
}

export default function PasswordInput({ id, name, placeholder, required, defaultValue }: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", width: "100%" }}>
      <input
        type={show ? "text" : "password"}
        id={id}
        name={name}
        placeholder={placeholder}
        required={required}
        defaultValue={defaultValue}
        style={{
          width: "100%",
          padding: "0.95rem",
          paddingRight: "2.5rem",
          borderRadius: "8px",
          border: "1px solid #ddd",
          fontSize: "0.9rem",
          background: "#fafafa",
          boxSizing: "border-box"
        }}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        style={{
          position: "absolute",
          right: "12px",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#666",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0
        }}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
