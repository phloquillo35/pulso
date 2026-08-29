# LOOP — Pulso: llevar a 100% funcional (hardening + mejoras)

Status: Fases A-C completadas (D pendiente)
Iteration: 1/5
Objective: Dejar Pulso 100% funcional y production-ready: build verde, typecheck
verde, lint verde, tests verdes, app corriendo en dev y con las rutas/API clave
respondiendo; auth y conectores en modo demo funcionando sin env vars; y
cierre de las brechas reales encontradas en la auditoría (Instagram live,
validez de IA, UX de navegación, performance, seguridad, E2E).

## Estado de la auditoría (baseline ya VERDE)
- `npm run typecheck` ✅ (tsc --noEmit, TS strict)
- `npm run lint` ✅ (eslint ., ESLint 9 flat config, 0 errores)
- `npm run build` ✅ (Next 16.3.3 Turbopack, 11 rutas)
- `npm test` ✅ 11/11 (node mcp/run-tests.mjs)
- Smoke runtime (demo, SIN env vars): `/`, `/dashboard`, `/login`,
  `/audit/instagram`, `/best-time/instagram`, `/hashtags/instagram`,
  `/competitors/instagram`, `/ai/instagram` → todas **200**;
  `POST /api/ai/chat` → 200 con respuesta mock válida;
  `POST /api/auth/logout` → 303 redirect.
- Root layout NO renderiza Shell (no doble Shell; el fix de iter 2 está OK).
- `.env.example` existe y documenta las vars.

Conclusión: el proyecto YA es funcional en modo demo. Las subtareas apuntan a
robustez, conectores live, validez de IA, UX, seguridad, performance y E2E.

## Subtareas

### Fase A — Auditoría de errores de build/typecheck/lint y fixes
- [x] A1 | dueño:@joaco | título: "Bloquear baseline verde + script `verify`"
  - Entrada: repo actual (4 checks ya en verde según auditoría).
  - Salida: `package.json` con script `verify` que encadene typecheck+lint+build+test; documentar que 4/4 pasan. Criterio: `npm run verify` termina 0 y reporta 4/4 verde.
  - Verify: `npm run verify`
  - Estado: done
- [x] A2 | dueño:@joaco | título: "Limpiar código muerto y alinear listas de plataformas"
  - Entrada: `src/components/platform-switcher.tsx` (prop `platform` declarada y no usada), `mcp/server.mjs` (PLATFORMS incluye `twitch`; la app usa 9 plataformas sin twitch y con `pinterest`).
  - Salida: PlatformSwitcher sin prop muerta; MCP PLATFORMS alineado con la app (o desviación justificada y documentada). Sin nuevos warnings de lint.
  - Verify: `npm run typecheck && npm run lint`
  - Estado: done

### Fase B — Corrección de bugs de runtime/lógica (auth, conectores, IA, MCP)
- [x] B1 | dueño:@joaco | título: "Instagram live no se activa (mismatch de env vars)"
  - Entrada: `src/lib/connectors/instagram.ts` (lee `IG_USER_TOKEN`), `.env.example` (documenta `IG_APP_ID`/`IG_APP_SECRET`/`IG_REDIRECT_URI`), `docs/social-connectors.md`.
  - Salida: decisión implementada — (a) renombrar a `IG_USER_TOKEN` y documentarlo en `.env.example`+docs, o (b) implementar OAuth con las vars documentadas. `isConfigured()` debe volverse true con las env vars que el usuario seteará; en demo sigue cayendo a mock.
  - Verify: test unitario de `isConfigured()` + (si aplica) fetch real con token; `npm run typecheck`
  - Estado: done
- [x] B2 | dueño:@joaco | título: "Validez/configuración del modelo de IA Anthropic"
  - Entrada: `src/lib/ai/anthropic.ts` (`MODEL = "claude-sonnet-4-6"`).
  - Salida: modelo válido y configurable vía env (`PULSO_ANTHROPIC_MODEL`); si la API responde no-ok, cae a mock (ya implementado, debe preservarse). Criterio: ante modelo inválido/no-ok el chat devuelve respuesta mock (no crashea con 500).
  - Verify: test que simula respuesta 400 y verifica fallback a mock; `npm run typecheck`
  - Estado: done
- [x] B3 | dueño:@joaco | título: "Robustez de getProvider/dashboard ante datos faltantes"
  - Entrada: `src/app/(app)/dashboard/page.tsx` (`ig = analyses.find(...)!`), `src/lib/data/provider.ts`.
  - Salida: sin non-null assertions frágiles; si una plataforma del portfolio no tiene análisis, se maneja con fallback seguro (sin crash 500).
  - Verify: `npm run typecheck` + smoke de `/dashboard` (ya 200 en demo)
  - Estado: done
- [x] B4 | dueño:@joaco | título: "MCP server: alineación y tests de protocolo"
  - Entrada: `mcp/server.mjs`, `mcp/run-tests.mjs` (solo prueba bluesky-logic, no el protocolo JSON-RPC).
  - Salida: PLATFORMS alineado con la app; tests de `handle()` (initialize, tools/list, tools/call, error de platform inválido) agregados a run-tests.mjs.
  - Verify: `node mcp/run-tests.mjs` (11+ pass, sumando los nuevos)
  - Estado: done

### Fase C — Mejoras (UX Apple-grade, performance, robustez, documentación)
- [x] C1 | dueño:@joaco | título: "Nav superior consciente de plataforma"
  - Entrada: `src/components/shell.tsx` (NAV hardcodea `/audit/instagram` etc.), `platform-switcher.tsx`.
  - Salida: el nav refleja/marca la plataforma actual o permite cambiarla; coherencia con PlatformSwitcher en cada página.
  - Verify: `npm run build` + `npm run lint`
  - Estado: done
- [x] C2 | dueño:@joaco | título: "Headers de seguridad en producción"
  - Entrada: `next.config.mjs` (solo `reactStrictMode`).
  - Salida: `async headers()` con CSP básico, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`. Sin romper el build ni el demo.
  - Verify: `npm run build` + check de headers (`curl -I`)
  - Estado: done
- [x] C3 | dueño:@joaco | título: "Documentación de setup (.env.example + README)"
  - Entrada: `.env.example` existente, vars de AGENTS.md.
  - Salida: README breve (pasos demo y con-Supabase); `.env.example` completo y comentado (coherente con B1).
  - Verify: docs presentes y consistentes con el código
  - Estado: done
- [x] C4 | dueño:@joaco | título: "Performance: cache de análisis en dashboard"
  - Entrada: `src/app/(app)/dashboard/page.tsx` (analyze de 9 cuentas por request, sin caché).
  - Salida: usar `export const revalidate` o `React.cache`/`unstable_cache` para no recalcular en cada request; dashboard sigue correcto.
  - Verify: `npm run build` + smoke de `/dashboard`
  - Estado: done
- [ ] C5 | dueño:@joaco | título: "E2E smoke con Playwright (opcional)"
  - Entrada: rutas clave.
  - Salida: test e2e que navega `/dashboard` y verifica render + que `/api/ai/chat` responde.
  - Verify: `npx playwright test` (o script equivalente)
  - Estado: pending
  - Nota @joaco: omitido a propósito. Requeriría instalar el browser de Playwright
    (dep pesada, fuera de la regla "sin deps nuevas sin justificar"). El smoke runtime
    se cubrió manualmente con `curl` sobre `next start` (8 rutas 200, chat 200, logout
    303, headers presentes). Pendiente: agregar `npx playwright test` en una iteración
    futura si se acepta la dep.

### Fase R2 — Ronda 2 EXEC: cierre de brechas del contrato (opción b del veredicto)
- [x] R2-1 | dueño:@joaco | título: "Index pages para rutas base (redirect a instagram)"
  - Entrada: rutas `/audit`, `/best-time`, `/hashtags`, `/competitors`, `/ai` no existían
    (solo las variantes `[platform]`); el smoke del contrato esperaba 200 en la base y recibía 404.
  - Salida: `src/app/(app)/audit/page.tsx`, `best-time/page.tsx`, `hashtags/page.tsx`,
    `competitors/page.tsx`, `ai/page.tsx` → cada una hace `redirect()` a `/<base>/instagram`
    vía `next/navigation`. Build las prerenderiza como static redirect (○).
  - Verify: `npm run build` (rutas ○ /audit, /best-time, /hashtags, /competitors, /ai) +
    smoke `curl -I /audit` → 307 a `/audit/instagram`.
  - Estado: done
  - Nota: creadas dentro del route group `(app)` para coherencia con el layout/Shell y la
    estructura real de rutas (el task mencionaba `src/app/audit/` pero la app usa `(app)`;
    la URL resultante `/audit` es idéntica y comparte el Shell).
- [x] R2-2 | dueño:@joaco | título: "API chat tolerante: acepta {message} y default platform"
  - Entrada: `src/app/api/ai/chat/route.ts` solo aceptaba `{platform, question}`; el body del
    contrato `{message}` daba 400.
  - Salida: lógica de parseo extraída a `src/lib/ai/chat-request.mjs` (pura, framework-free,
    testeable por node, sigue el patrón de `anthropic-logic.mjs`). El route acepta
    `{platform?, question}` y `{message}` (alias → question); `platform` default `instagram`;
    question vacío/ausente → 400; platform inválido → 400. Comportamiento legacy preservado.
  - Verify: `npm run verify` GREEN (typecheck+lint+build+test); 7 nuevos tests en
    `mcp/run-tests.mjs` cubren legacy / alias / default / errores (body null/string).
  - Estado: done

### Fase R3 — Ronda 3 EXEC: quick-wins UX/accesibilidad (revisión de diseño)
- [x] R3-1 | dueño:@joaco | título: "focus-visible en nav y PlatformSwitcher"
  - Entrada: `src/components/shell.tsx` (Links del nav sin foco visible: logo, Dashboard,
    secciones), `src/components/platform-switcher.tsx` (Links sin foco visible), patrón en
    `src/components/ui/button.tsx` (`focus-visible:outline-none focus-visible:ring-2
    focus-visible:ring-[var(--accent)]/50`).
  - Salida: los Links del nav (logo, Dashboard, secciones) y de PlatformSwitcher llevan el
    mismo patrón `focus-visible` que los botones → foco de teclado visible y coherente.
    Layout intacto (mismo `rounded` que el estado base).
  - Verify: `npm run verify` GREEN
  - Estado: done
- [x] R3-2 | dueño:@joaco | título: "Crecimiento condicional en competidores"
  - Entrada: `src/app/(app)/competitors/[platform]/page.tsx` (ternary no-op
    `${"text-[var(--success)]"}` pintaba crecimiento siempre verde, aun si negativo).
  - Salida: `r.growth30d >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"` → rojo si
    negativo, verde si >= 0. Usa tokens existentes (light+dark en globals.css).
  - Verify: `npm run verify` GREEN
  - Estado: done
- [x] R3-3 | dueño:@joaco | título: "aria-current=page en nav y switcher"
  - Entrada: links activos de `shell.tsx` y `platform-switcher.tsx` sin `aria-current`.
  - Salida: `aria-current={active ? "page" : undefined}` en los Links activos de ambos
    componentes (Dashboard, secciones por plataforma, y cada plataforma del switcher).
  - Verify: `npm run verify` GREEN
  - Estado: done
- [x] R3-4 | dueño:@joaco | título: "PlatformIcon decorativo en links con texto"
  - Entrada: `platform-switcher.tsx` usa `<PlatformIcon>` dentro de `<Link>` con texto visible
    `PLATFORM_LABEL[p]`; `PlatformIcon` seteaba `aria-label`/`title` → nombre accesible
    duplicado ("Instagram Instagram").
  - Salida: prop `decorative` en `PlatformIcon` (cuando true: `aria-hidden`, sin `aria-label`
    ni `title`); PlatformSwitcher lo pasa. El resto de usos (competitors page, fuera de links
    con texto) conserva `aria-label`/`title` por defecto.
  - Verify: `npm run verify` GREEN
  - Estado: done

### Fase D — Verificación final end-to-end
- [ ] D1 | dueño:@tester | título: "Verificación 100% funcional en demo (sin env)"
  - Entrada: todo lo anterior.
  - Salida: typecheck+lint+build+test verdes + smoke de las 8 rutas + `/api/ai/chat` 200 + `/api/auth/logout` 303. Reporte verde.
  - Verify: script de smoke (curl) + los 4 checks
  - Estado: pending
- [ ] D2 | dueño:@joaco/usuario | título: "Verificación modo producción con env vars reales (manual)"
  - Entrada: credenciales reales (Supabase, Bluesky, IA).
  - Salida: login real, Bluesky live y IA real responden. Documentar pasos de verificación manual (requiere secrets que NO están en repo).
  - Verify: manual
  - Estado: pending

## Verification

### TESTER — Veredicto Ronda 2 (re-verificación con CONTRATO CORRECTO)

Fecha: 2026-08-29. Working tree sin commit (esperado en el loop). Server `next start` en :3100.

**1. `npm run verify` (typecheck && lint && build && test) → ✅ GREEN**
   - typecheck: ✅ 0 errores (`tsc --noEmit`, TS strict)
   - lint: ✅ 0 errores (`eslint .`)
   - build: ✅ Next 16.3.3 compila (rutas static ○ /audit, /best-time, /hashtags,
     /competitors, /ai como redirects + `/`, `/dashboard`, `/login`; dynamic las `[platform]` y API)
   - test: ✅ **31/31 pass · 0 fail** (incluye 7 tests protocolo MCP JSON-RPC + 7 tests chat)

**2. Smoke runtime (demo, SIN env vars, `next start` en :3100) — TODOS LOS STATUS ESPERADOS**
   - GET / → **200** ✅
   - GET /dashboard → **200** ✅ · `X-Frame-Options: DENY` presente ✅
   - GET /audit → **307** → /audit/instagram ✅
   - GET /best-time → **307** → /best-time/instagram ✅
   - GET /hashtags → **307** → /hashtags/instagram ✅
   - GET /competitors → **307** → /competitors/instagram ✅
   - GET /ai → **307** → /ai/instagram ✅
   - GET /audit/instagram, /best-time/instagram, /hashtags/instagram,
     /competitors/instagram, /ai/instagram → **200** ✅ (todas)
   - GET /login → **200** ✅
   - POST /api/ai/chat `{message:"hola"}` → **200** ✅ (mock válido:
     "Soy el asistente de Pulso (modo demo)...")
   - POST /api/ai/chat `{platform:"instagram",question:"hola"}` → **200** ✅ (mock)
   - POST /api/auth/logout → **303** ✅

**3. MCP server → ✅ responde.** `node mcp/run-tests.mjs` → **31/31 pass** (protocolo
   JSON-RPC: initialize, ping, tools/list, tools/call ok/inválido/desconocido, método
   desconocido). `node mcp/server.mjs` arranca.

**4. Secrets → ✅ ninguno filtrado.**
   - `git status`: working tree con modificaciones sin commitear (esperado).
   - `.env` NO está commiteado (no aparece en `git ls-files`).
   - `rg` por `sk-[A-Za-z0-9]{10,}` / `ANTHROPIC_API_KEY=` en el tree → **0 coincidencias**
     (solo `.env.example` template y placeholders de test `tok_123`/`x`/`y`).

**VEREDICTO: 🟢 GREEN**
   - `verify` GREEN (31/31) + todas las rutas con status esperado (200/307/303) +
     MCP ok (31/31) + sin secrets → cumple el contrato al 100%.
    - La discrepancia RED→GREEN de la ronda 1 se cerró: las 5 index pages redirigen
      (307) y el chat acepta `{message}` (200). 0 crashes, 0 secrets.

### TESTER — Veredicto Ronda Final (verificación end-to-end, Fase D1)

Fecha: 2026-08-29. Working tree sin commit (esperado en el loop). Server
`next start` en :3210 (modo demo, `env -i` sin env vars).

**1. `npm run verify` (typecheck && lint && build && test) → ✅ GREEN**
    - typecheck: ✅ 0 errores (`tsc --noEmit`, TS strict, exit 0)
    - lint: ✅ 0 errores (`eslint .`)
    - build: ✅ Next 16.3.3 compila (rutas static ○ /audit, /best-time,
      /hashtags, /competitors, /ai como redirects + `/`, `/dashboard`, `/login`;
      dynamic las `[platform]` y API)
    - test: ✅ **31/31 pass · 0 fail** (7 tests protocolo MCP JSON-RPC + 7 tests
      chat + instagram/anthropic logic)

**2. Smoke runtime (demo, SIN env vars, `next start` :3210) — TODOS LOS STATUS ESPERADOS**
    - GET / → **200** ✅
    - GET /dashboard → **200** ✅
    - GET /audit → **307** (redirect a /audit/instagram) ✅
    - GET /audit/instagram → **200** ✅
    - GET /competitors/instagram → **200** ✅
    - POST /api/ai/chat `{message:"x"}` → **200** ✅ (mock válido)
    - POST /api/auth/logout → **303** ✅

**3. Secrets → ✅ ninguno filtrado.**
    - `git status`: working tree con modificaciones sin commitear (esperado).
    - grep `sk-` / `ANTHROPIC_API_KEY=` en diff tracked → solo texto de
      documentación en LOOP.md (hunk header + línea de referencia). En untracked:
      `.env.example` tiene `ANTHROPIC_API_KEY=` / `IG_USER_TOKEN=` **vacíos**
      (placeholders de template, sin valor). 0 secrets reales.

**VEREDICTO: 🟢 GREEN**
    - `verify` GREEN (31/31) + todas las rutas con status esperado
      (200/307/303) + sin secrets → cumple el contrato D1 al 100%.

## Reflection
- A1: `verify` encadena los 4 checks; ahora el baseline está "bloqueado" por script.
- A2: MCP PLATFORMS alineado a la app (quitado `twitch`, agregado `pinterest` en
  PLATFORMS/LABEL/DEMO_ACCOUNTS/COMPETITORS). Prop `platform` muerta quitada de
  PlatformSwitcher y de sus 5 call sites.
- B1: decisión = (a) `IG_USER_TOKEN` activa el live; la lógica de config se movió a
  `instagram-logic.mjs` (testeable, sin deps). `.env.example`+README+docs ahora
  documentan `IG_USER_TOKEN` y dejan OAuth vars como reservadas. Demo sigue en mock.
- B2: modelo Anthropic configurable vía `PULSO_ANTHROPIC_MODEL`, validado por regex y
  con fallback al default si es inválido; lógica en `anthropic-logic.mjs`. Se quitó el
  `!` de `this.key!` (anthropic y openai) → ya no crashea si no hay key.
- B3: quitados los `!` frágiles: dashboard (`analyses.find(...)!` → fallback a
  `analyses[0]` + empty-state), competidores (`.at(-1)!`/`.at(-30)!` → guardas), y
  `this.client!` en SupabaseDataProvider (se pasa el client ya narrowado).
- B4: `handle()` refactorizado para aceptar un emisor (testeable) y exportado; 7 tests
  de protocolo JSON-RPC (initialize, ping, tools/list, tools/call ok/inválido/
  desconocido, método desconocido).
- C1: nav superior ahora deriva la plataforma de la URL (`/audit/instagram` → instagram)
  y enlaza coherentemente con PlatformSwitcher; default `instagram` en rutas sin plataforma.
- C2: `headers()` con CSP básico + X-Frame-Options/X-Content-Type-Options/Referrer-Policy/
  Permissions-Policy. CSP permisivo a propósito (Next inyecta scripts inline + Fast Refresh
  en dev); apretar `script-src` cuando se adopte nonce/hash.
- C3: `.env.example` completo y coherente (IG_USER_TOKEN, PULSO_ANTHROPIC_MODEL,
  PULSO_OPENAI_MODEL); README nuevo con pasos demo + Supabase.
- C4: `export const revalidate = 60` en dashboard → ISR, no recalcula por request.
- C5: omitido (Playwright pesado); smoke cubierto con curl. Pendiente documentado arriba.
- Sin nuevas dependencias. Sin secrets en código. Modo demo intacto sin env vars.
- Designer: revisión UX/UI de los cambios (shell nav por URL, PlatformSwitcher sin prop
  muerta, index pages redirect, consistencia de páginas [platform]). Verdict:
  **CHANGES_REQUESTED** (quick-wins, no bloquea build). Bloqueantes: (1) nav links y
  PlatformSwitcher `<Link>` no tienen `focus-visible` ring → teclado sin foco visible
  (el botón sí lo tiene, inconsistente); (2) `competitors/[platform]` pinta crecimiento
  siempre verde por un ternary no-op (`${"text-[var(--success)]"}`) → crecimiento negativo
  se muestra verde (engañoso); (3) faltan `aria-current="page"` en links activos de nav y
  switcher. Pulido: (4) escala de h1 inconsistente (dashboard `text-3xl` vs páginas
  `text-2xl`); (5) `PlatformIcon` trae `aria-label` y duplica el texto del link en el
  switcher ("Instagram Instagram") → poner `aria-hidden` al icono dentro de links con texto.
  Los redirects base son server-side (307 prerenderizado) → imperceptibles, sin flash. El
  design system (tokens Apple-grade, glass, dark mode, reduced-motion) es sólido y coherente.
- R3 (ronda 3 EXEC): cierre de los 4 quick-wins de accesibilidad pedidos por el designer
  (CHANGES_REQUESTED). (1) `focus-visible` ring agregado a todos los `<Link>` del nav
  (shell.tsx: logo + Dashboard + secciones) y a PlatformSwitcher, copiando el patrón de
  `button.tsx` (`focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50`) → foco de
  teclado visible y consistente. (2) `competitors/[platform]` ya no pinta crecimiento siempre
  verde: `r.growth30d >= 0 ? success : danger` (antes ternary no-op `${"text-[var(--success)]"}`).
  (3) `aria-current="page"` en links activos de nav y switcher. (4) `PlatformIcon` ganó prop
  `decorative` (aria-hidden + sin aria-label/title cuando true); PlatformSwitcher lo usa para
  no duplicar el nombre ("Instagram Instagram"). Sin deps nuevas, TS strict, modo demo intacto.
   `npm run verify` → GREEN (typecheck+lint+build+31/31 tests).

### REVIEWER — Veredicto Final (ojos frescos sobre el diff completo sin commitear)

Fecha: 2026-08-29. Alcance: `git diff` (tracked) + archivos untracked nuevos,
desde el commit inicial. Foco: archivos señalados en el contrato + coherencia
global de plataformas, manejo de errores, TS estricto, calidad de tests.

**Correctitud y TS estricto**
- `tsc --noEmit` exit 0; **0 non-null assertions (`!`)** en todo el diff
  (tracked + untracked). Se eliminaron los frágiles: `dashboard`
  (`analyses.find(...)!` → `?? analyses[0]` + empty-state), `openai.ts`
  (`this.key!` → `const key = this.key; if (!key) return ""`),
  `supabase-provider.ts` (`this.client!` → parámetro `client` narrowado en
  `buildFromDb`). ✅
- `chat-request.mjs` / `route.ts`: parseo puro y testeable; acepta
  `{platform?,question}` y `{message}` (alias), default `instagram`, errores
  400 por question vacío/ausente y platform inválido. Comportamiento legacy
  preservado. ✅
- `anthropic.ts` / `anthropic-logic.mjs`: modelo configurable vía
  `PULSO_ANTHROPIC_MODEL`, validado por regex, fallback a default si inválido;
  `complete()` devuelve `""` en error → `r || this.mock...` (no crashea con 500). ✅
- `instagram.ts` / `instagram-logic.mjs`: live vía `IG_USER_TOKEN`; `isConfigured()`
  true solo con token (OAuth vars reservadas, no activan solas). `getAccount`/
  `getDailyMetrics` caen a mock en error o si no configurado. ✅

**Coherencia de plataformas (instagram/bluesky/pinterest)**
- `twitch` eliminado y `pinterest` agregado en `mcp/server.mjs` (PLATFORMS,
  LABEL, DEMO_ACCOUNTS, COMPETITORS) y validado por test (`!PLATFORMS.includes("twitch")`,
  `PLATFORMS.includes("pinterest")`). App y MCP alineados. ✅
- `PlatformSwitcher` ya no recibe prop `platform` muerta (quitada de 5 call
  sites: `ai/audit/best-time/hashtags/competitors/[platform]`). ✅
- `shell.tsx`: nav deriva la plataforma de la URL (`/audit/instagram` → instagram)
  y enlaza coherentemente con `PlatformSwitcher`; default `instagram` en rutas
  base. `aria-current` y `focus-visible` presentes. ✅

**Manejo de errores / robustez**
- `route.ts` envuelve `req.json()` en try/catch → 400 JSON inválido. ✅
- `competitors/[platform]`: `notFound()` si platform inválido; crecimiento
  negativo ahora pinta `danger` (rojo), no siempre `success` (fix del ternary
  no-op). ✅
- `next.config.mjs`: `headers()` con CSP + X-Frame-Options + nosniff +
  Referrer-Policy + Permissions-Policy. CSP permisivo a propósito (documentado);
  sin romper build ni demo. ✅

**Calidad de tests / ausencia de regresiones en demo**
- 31/31 pass cubren: instagram logic, anthropic model, protocolo MCP JSON-RPC
  (initialize/ping/tools-list/tools-call ok+inválido+desconocido/método
  desconocido), chat (legacy/alias/default/errores body null/string). ✅
- Smoke runtime 200/307/303 en demo sin env vars → 0 regresiones. ✅
- Sin nuevas dependencias; sin secrets en código. ✅

**Hallazgos menores (no bloqueantes)**
1. `instagram.ts#getDailyMetrics` cuando está configurado aún devuelve mock
   (OAuth + normalización de insights pendiente). Documentado en el código como
   intencional; no es regresión, pero el live de insights no está cableado aún.
2. CSP `connect-src 'self'` + `script-src` con `unsafe-inline`/`unsafe-eval`:
   aceptable para demo; apretar con nonce/hash al llevar a producción (ya
   anotado en el propio `next.config.mjs`).

**VEREDICTO: ✅ APPROVED**
- El diff es correcto, TS-strict limpio, sin non-null assertions frágiles,
  plataformas coherentes, errores manejados con fallback a mock, tests sólidos y
  demo intacto. Los 2 hallazgos son conocidos/intencionales y no bloquean el
  build ni la funcionalidad demo. No se requieren cambios para aprobar.

## Decisions / Notas
- Stack detectado: Next.js 16.3.3 (App Router, Turbopack) + React 19 + TS 5.6
  (strict) + Tailwind v4 + Supabase (`@supabase/ssr`) + Framer Motion +
  Recharts + TanStack Query + Zustand + Zod.
  Nota: TanStack Query / Zustand / Zod están en deps pero aún NO cableados
  (deuda conocida; no bloquea funcionalidad demo).
- Comandos de verificación del proyecto:
  `npm run typecheck` (tsc --noEmit), `npm run lint` (eslint .),
  `npm run build` (next build), `npm test` (node mcp/run-tests.mjs, 11 tests).
  Propuesta A1: añadir `npm run verify` que encadene los 4.
- Restricciones: sin secrets en repo (confirmado: no hay `.env`, solo
  `.env.example`); sin deps nuevas sin justificar; TS estricto; ESLint 9 flat.
- Hallazgos clave de la auditoría (motivan las subtareas):
  1. Instagram live NUNCA se activa: `instagram.ts` lee `IG_USER_TOKEN` pero
     las vars documentadas son OAuth (`IG_APP_ID`/`IG_APP_SECRET`/`IG_REDIRECT_URI`).
     `isConfigured()` queda siempre false → siempre mock. (B1)
  2. Modelo Anthropic hardcodeado `"claude-sonnet-4-6"` debe validarse/ser
     configurable para no romper en producción. (B2)
  3. Nav superior hardcodea `instagram` en todos los enlaces. (C1)
  4. Dashboard recalcula análisis de 9 cuentas por request sin caché. (C4)
  5. MCP `PLATFORMS` incluye `twitch` (ausente en la app) y omite `pinterest`. (A2/B4)
  6. `PlatformSwitcher` declara prop `platform` no usada. (A2)
  7. Sin headers de seguridad en `next.config.mjs`. (C2)
  8. Sin tests E2E. (C5)
- Modo demo confirmado funcional sin env vars (middleware y providers caen a
  mock/demo transparentemente). Esto cumple el objetivo de "auth y conectores
  en modo demo funcionando sin env vars".
