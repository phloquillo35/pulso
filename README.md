# Pulso

Analytics de redes sociales para creadores y negocios. Dashboard unificado,
auditoría por cuenta, mejor hora para publicar, hashtags, benchmarking de
competidores e un asistente de IA. Next.js (App Router) + React + TypeScript +
Tailwind, con conectores mock/live y capa de IA pluggable.

## Modo demo (sin env vars)

```bash
npm install
npm run dev
# abrí http://localhost:3000
```

Sin ninguna variable de entorno la app corre 100% en modo demo: los conectores
caen a `MockConnector` y la IA a `MockAIService`. Todas las rutas responden.

## Modo producción (con env vars)

1. Copiá `.env.example` a `.env.local` y completá lo que necesites:
   - **Supabase** (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
     `SUPABASE_SERVICE_ROLE_KEY`) → habilita auth multi-tenant y datos reales
     (con fallback a demo cuando no hay sesión).
   - **IA** (`ANTHROPIC_API_KEY` o `OPENAI_API_KEY`) → activa resúmenes reales.
     `PULSO_AI_PROVIDER` elige el proveedor; `PULSO_ANTHROPIC_MODEL` /
     `PULSO_OPENAI_MODEL` sobreescriben el modelo (validados, con fallback).
   - **Bluesky** (`BLUESKY_IDENTIFIER` + `BLUESKY_APP_PASSWORD`) → conector live
     (API abierta, sin app review).
   - **Instagram** → seteá `IG_USER_TOKEN` (long-lived token de Meta Graph API)
     para activar el live. Las vars `IG_APP_ID`/`IG_APP_SECRET`/`IG_REDIRECT_URI`
     quedan reservadas para el flujo OAuth futuro.
2. `npm run dev` (o `npm run build && npm run start`).

## Scripts

| Script | Qué hace |
| --- | --- |
| `npm run dev` | servidor de desarrollo |
| `npm run build` | build de producción |
| `npm run start` | sirve el build |
| `npm run typecheck` | `tsc --noEmit` (TS strict) |
| `npm run lint` | ESLint 9 (flat config) |
| `npm run test` | tests de analytics + protocolo MCP (`node mcp/run-tests.mjs`) |
| `npm run verify` | typecheck + lint + build + test encadenados |
| `npm run mcp` | levanta el servidor MCP en stdio |

## Arquitectura

```
SocialConnector (Mock / Instagram / Bluesky)
   → DataProvider (Mock / Supabase)  → server components  → UI
AIService (Anthropic / OpenAI / Mock) → asistente de Pulso
mcp/server.mjs  → expone los analytics como herramientas JSON-RPC para agentes
```

Regla de oro: cada conector mantiene la I/O; la transformación vive en un módulo
puro `*-logic.mjs` (testeable sin build). Siempre hay fallback a mock para que la
UI nunca se rompa. Los datos reales son opt-in vía env vars.

Ver `docs/social-connectors.md` para el detalle de cada conector.
