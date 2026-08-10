"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("PAGE ERROR BOUNDARY CAUGHT:", error);
  }, [error]);

  return (
    <div style={{ padding: "2rem", color: "red" }}>
      <h2>Ocorreu um erro no servidor! (Error Boundary)</h2>
      <pre style={{ whiteSpace: "pre-wrap", background: "#fee", padding: "1rem" }}>
        {error.message}
      </pre>
      {error.stack && (
        <pre style={{ whiteSpace: "pre-wrap", background: "#fee", padding: "1rem", marginTop: "1rem", fontSize: "0.8rem" }}>
          {error.stack}
        </pre>
      )}
      <button
        onClick={() => reset()}
        style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}
      >
        Tentar novamente
      </button>
    </div>
  );
}
