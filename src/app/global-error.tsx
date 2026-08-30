"use client";

// Root error boundary. Must render its own <html>/<body> because it replaces
// the root layout when that layout itself throws. Inline styles (no globals.css)
// so it works even when the stylesheet failed to load.
export default function GlobalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, 'Segoe UI', sans-serif",
          background: "#000",
          color: "#f5f5f7",
        }}
      >
        <div style={{ textAlign: "center", padding: 24, maxWidth: 420 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 8px" }}>
            Algo salió mal
          </h1>
          <p style={{ color: "#98989d", margin: "0 0 20px", lineHeight: 1.5 }}>
            Hubo un error crítico. Recargá la página para continuar.
          </p>
          <button
            onClick={reset}
            style={{
              background: "#0a84ff",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "10px 18px",
              fontSize: 15,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
