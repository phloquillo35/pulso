"use client";

import { useState } from "react";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Msg {
  role: "user" | "assistant";
  text: string;
}

export function ChatPanel({ platform }: { platform: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ platform, question: q }),
      });
      const d = await res.json().catch(() => null);
      if (!res.ok) {
        const text =
          d && typeof d.error === "string" && d.error.trim()
            ? d.error
            : "No pude responder ahora, reintentá.";
        setMessages((m) => [...m, { role: "assistant", text }]);
        return;
      }
      setMessages((m) => [
        ...m,
        { role: "assistant", text: (d && d.answer) || "No pude responder ahora, reintentá." },
      ]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "Error de conexión." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[460px] flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 && (
          <p className="text-sm text-[var(--muted)]">
            Preguntale a Pulso sobre tus datos: horarios, hashtags, competidores o tu audit.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
              m.role === "user"
                ? "ml-auto bg-[var(--accent)] text-[var(--accent-fg)]"
                : "bg-[var(--surface-2)] text-[var(--fg)]",
            )}
          >
            {m.text}
          </div>
        ))}
        {loading && <div className="text-sm text-[var(--muted)]">Pulso está pensando…</div>}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Escribí tu pregunta…"
          className="flex-1 rounded-[12px] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm outline-none"
        />
        <button onClick={send} disabled={loading} className={buttonClasses("primary", "md")}>
          Enviar
        </button>
      </div>
    </div>
  );
}
