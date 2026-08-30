# AGENTS.md (Workflow Context) — pulso
> Generado: 2026-08-29 22:17:33 · Herramienta: opencode · Proyecto: /Users/pablohernandezcanelo/Documents/pulso

## 🎯 Objetivo actual
Pulso iter4: fix cold-start chat, error UI, logout origin, callback open-redirect, 46/46 tests

## 📍 Estado actual
  Branch: main · Working tree: SUCIO (1 archivos)

  Cambios sin commit:
   AGENTS.md | 83 ++-------------------------------------------------------------
   1 file changed, 2 insertions(+), 81 deletions(-)
   M AGENTS.md

  Últimos commits:
  85aeb76 fix(iter4): cold-start 400, chat error UI, logout origin, callback open-redirect
  dc8c397 docs: AGENTS.md handoff iter3
  18bf765 feat(iter3): CSP Supabase, timeouts, focus unify, IG Bearer, auth callback, typed rows, asPlatform, MCP hardening
  0ed7c5b docs: AGENTS.md handoff iter2
  a6c984f feat(iter2): instagram live metrics, CSP, error boundaries, a11y, loading/empty states

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
README.md
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
    IG_USER_TOKEN
    NEXT_PUBLIC_APP_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY
    NEXT_PUBLIC_SUPABASE_URL
    OPENAI_API_KEY
    PULSO_AI_PROVIDER
    PULSO_ANTHROPIC_MODEL
    PULSO_OPENAI_MODEL
    SUPABASE_SERVICE_ROLE_KEY

## 📦 Comandos útiles
  Scripts disponibles:
    dev: next dev
    build: next build
    start: next start
    typecheck: tsc --noEmit
    lint: eslint .
    test: node mcp/run-tests.mjs
    verify: tsc --noEmit && eslint . && next build && node mcp/run-tests.mjs
    mcp: node mcp/server.mjs
    typecheck: npx tsc --noEmit

## 🧠 Decisiones tomadas
          _(decisiones de diseño/acuerdo a registrar aquí)_
