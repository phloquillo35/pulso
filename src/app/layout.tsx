import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pulso — Inteligencia para tus redes sociales",
  description:
    "Monitoreá, analizá y mejorá tus perfiles para hacer crecer tu negocio y tu cuenta de creador. Dashboard unificado, audit de perfil, mejor hora para publicar, hashtags e insights con IA.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
