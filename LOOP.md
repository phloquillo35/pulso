# LOOP — Pulso: plataforma de inteligencia para redes sociales

Status: done (iteración 2 completa)
Iteration: 2/5
Objective: Construir **Pulso**, una web app (futura) que monitoriza redes sociales y
mejora perfiles para hacer crecer negocios y creadores. Producto COMPLETO sobre
arquitectura 100% real: dashboard unificado, audit de perfil, mejor-hora, hashtags,
formato, competidores, insights+chat con IA (Anthropic+OpenAI), conectores reales
(Bluesky abierto + Instagram listo-para-credenciales) y MCP server. Diseño Apple-grade.

## Subtareas
- [x] S1 scaffold | dueño:@joaco | salida: `npm run build` OK | verify: tsc+next build | estado:done
- [x] S2 design-system | dueño:@joaco | salida: Button/Card/Badge/Stat/PlatformIcon/Heatmap/Charts + Shell + PlatformSwitcher + Reveal (framer) | verify: tsc+build | estado:done
- [x] S3 data-model | dueño:@joaco | salida: supabase/migrations/0001_init.sql + tipos TS + RLS multi-tenant + client/server/middleware | verify: tsc | estado:done
- [x] S4 connectors | dueño:@joaco | salida: MockConnector (rico, seeded) + InstagramConnector (env-gated) + BlueskyConnector (abierto) | verify: tsc | estado:done
- [x] S5 ai-layer | dueño:@joaco | salida: Anthropic+OpenAI+Mock (executiveSummary/weeklyPlan/chat) con fallback | verify: tsc | estado:done
- [x] S6 pages-core | dueño:@joaco | salida: Landing + Dashboard + Audit + BestTime + Hashtags + Competitors + AI/Chat + /api/ai/chat | verify: tsc+build+smoke(200) | estado:done
- [x] S7 mcp | dueño:@joaco | salida: mcp/server.mjs (stdio, 5 tools) + run-tests.mjs (7/7) | verify: node mcp/run-tests.mjs | estado:done
- [x] S8 verify+reflect | dueño:@tester/@reviewer | salida: GREEN (typecheck+build+tests+smoke) | verify: build+lint+tests | estado:done
- [x] S9 multi-tenant+auth+bluesky-live | dueño:@joaco | salida: SupabaseDataProvider (RLS, fallback demo) + login/signup/logout + protección de rutas + Bluesky live (getAuthorFeed) con lógica pura testeable + docs/social-connectors.md + fix doble Shell | verify: typecheck+lint+build+tests(11/11)+smoke | estado:done

## Verification
GREEN. `npm run typecheck` ✅ · `npm run lint` ✅ (0 errores, flat config ESLint 9) ·
`npm run build` ✅ (11 rutas) · `npm test` ✅ 11/11 · smoke `npm run start` ✅ todas
las rutas 200 + /login SSR + dashboard sin doble Shell.

## Reflection
- Iteración 2 entregada: multi-tenant real (SupabaseDataProvider con RLS + fallback a
  demo), auth de usuario (Supabase Auth + middleware de protección + logout), y Bluesky
  en vivo real vía `getAuthorFeed` con lógica pura testeable y fallback a mock.
- Bluesky live: posts/hashtags/daily reales. Límite honesto de la API abierta: no hay
  reach/impressions ni histórico de seguidores (followers = valor actual, reach=0).
- Fix de doble Shell en dashboard (el layout `(app)` ya envuelve en Shell).
- `next lint` removido en Next 16 → reemplazado por flat config ESLint 9 (`eslint.config.mjs`).
- Deuda restante: pipeline de sync a DB (hoy el provider cae a demo si no hay filas),
  Zustand/TanStack sin cablear, sin E2E, TikTok/X sin connector real.

## Decisions / Notas
- Stack: Next.js 16 (App Router) + React 19 + TS strict + Tailwind v4 + Supabase (Postgres/Auth/RLS) + Framer Motion + Recharts + TanStack Query + Zustand + Zod.
- Default runnable = MockConnector (sin DB externo). Supabase/real APIs se activan con env vars.
- IA: abstracción con Anthropic y OpenAI; fallback a mock si no hay keys.
- MCP: módulo Node aparte que expone analytics como tools (diferenciador "futuro" + OpenClaw).
- Sin secrets en código; credenciales solo por env.
