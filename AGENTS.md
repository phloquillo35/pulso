# AGENTS.md (Workflow Context) — pulso
> Generado: 2026-08-26 23:32:49 · Herramienta: opencode · Proyecto: /Users/pablohernandezcanelo/Documents/pulso

## 🎯 Objetivo actual
Pulso: app de analytics de redes sociales. Iter 1 (scaffold Next16+React19+TS+Tailwind v4, design system Apple-grade, conectores Mock/IG/Bluesky, capa IA Anthropic/OpenAI/Mock, 6 paginas + /api/ai/chat, MCP server). Iter 2 (SupabaseDataProvider multi-tenant + fallback demo, auth login/signup/logout + proteccion de rutas, Bluesky en vivo real, docs social-connectors, fix doble Shell). Deploy Vercel verde en https://pulso-gules-eight.vercel.app (modo demo sin env vars).

## 📍 Estado actual
  (sin repo git)

## ✅ Tareas activas
  (sin tareas activas)

## 🧭 Próximo paso
_(continuar donde quedó opencode. Si hay tareas in_progress arriba, retomar la primera.)_

## 🧱 Archivos clave / arquitectura
  .
.env.example
.vercel
.vercel/README.txt
.vercel/project.json
AGENTS.md
LOOP.md
docs
docs/social-connectors.md
eslint.config.mjs
mcp
mcp/run-tests.mjs
mcp/server.mjs
middleware.ts
next-env.d.ts
next.config.mjs
package-lock.json
package.json
postcss.config.mjs
src
src/app
src/components
src/lib
supabase
supabase/migrations
tsconfig.json
tsconfig.tsbuildinfo

## 🔐 Variables de entorno requeridas
  Nombres de variables (sin valores):
    ANTHROPIC_API_KEY
    BLUESKY_APP_PASSWORD
    BLUESKY_IDENTIFIER
    IG_APP_ID
    IG_APP_SECRET
    IG_REDIRECT_URI
    NEXT_PUBLIC_APP_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY
    NEXT_PUBLIC_SUPABASE_URL
    OPENAI_API_KEY
    PULSO_AI_PROVIDER
    SUPABASE_SERVICE_ROLE_KEY

## 📦 Comandos útiles
  Scripts disponibles:
    dev: next dev
    build: next build
    start: next start
    typecheck: tsc --noEmit
    lint: eslint .
    test: node mcp/run-tests.mjs
    mcp: node mcp/server.mjs
    typecheck: npx tsc --noEmit

## 🧠 Decisiones tomadas
  _(decisiones de diseño/acuerdo a registrar aquí)_
