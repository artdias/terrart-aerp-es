"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import styles from "./login.module.css";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const res = await signIn("credentials", {
      email: username,
      password,
      rememberMe: rememberMe ? "true" : "false",
      redirect: false,
    });

    if (res?.error) {
      setError("Usuário ou senha incorretos.");
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <div style={{ textAlign: "center", marginBottom: "5px", display: "flex", justifyContent: "center" }}>
          <img src="/logo.png" alt="Elite Soluções" style={{ maxWidth: "200px", maxHeight: "200px", objectFit: "contain", transform: "scale(1.25)" }} />
        </div>
        <p className={styles.subtitle}>
          Gestão Inteligente de Terceirização 
          <span style={{ fontSize: "0.75rem", background: "#f1f5f9", color: "#64748b", padding: "2px 6px", borderRadius: "10px", marginLeft: "8px", fontWeight: 600 }}>v1.0</span>
        </p>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Usuário</label>
            <input 
              type="text" 
              placeholder="Nome de usuário"
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Senha</label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Sua senha"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                style={{ width: "100%", paddingRight: "40px" }}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
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
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "14px 0" }}>
            <input 
              type="checkbox" 
              id="rememberMe" 
              checked={rememberMe} 
              onChange={(e) => setRememberMe(e.target.checked)} 
              style={{ width: "16px", height: "16px", cursor: "pointer" }}
            />
            <label htmlFor="rememberMe" style={{ fontSize: "0.85rem", color: "#555", cursor: "pointer", userSelect: "none" }}>
              Mantenha-me conectado (Lembrar de mim)
            </label>
          </div>

          <button type="submit" className={styles.button}>Entrar no Sistema</button>
        </form>
      </div>
    </div>
  );
}
