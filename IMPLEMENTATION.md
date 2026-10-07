# IMPLEMENTATION — fanect-prototipo-v1

Base: arena synthesis (Candidate A zero-build + grafts from B).

## Delivered

- Zero-build ES modules under `src/`; serve with `python3 -m http.server 8766`
- Domain: `QrCodec` (encode/decode/evaluate/drawSeed/rotate), `machine` guards, tickets, decisions, Bogotá `nowLabel`
- Persist: `fanect_p1` schema v2 + one-shot migrate from `fanect_p0`
- App: `AppController` sole writer; hash router `#/hub`, `#/hincha/…`, `#/operador/…`; boot always hub
- Views: thin modules for registro/consent/resultado/fanpass/boleta/pase/decision/auditoria; other screens use `data-go` + HTML
- UX: inline errors (no `alert`), TTL auto-rotate on pase, stop timer on leave, stricter pase tab (no silent `TICKETS[0]`)
- Tokens: `styles/tokens.css` (type/space/motion) + ported phone-frame CSS
- Stable selectors preserved: `#screen-*`, `[data-go]`, `#btnScan`, `#decisionBanner`, `#qrCanvas`, `FanectDemo`

## Deviations from sketch

1. **Flat domain files** (`qr-codec.js`, not `domain/qr/QrSession.js` + `gate/ScanService.js`) — same public API name `QrCodec` as graft B.
2. **Not every screen has its own view module** — hub/entrada/verificacion/asistida/proveedor/operador-home/scanner rely on static HTML + controller enter hooks; happy path still fully clickable.
3. **Fixture-required UI softened** — if a live hincha payload exists, `#btnScan` enables without picking a fixture; fixtures remain overrides. Picking a fixture without live payload still synthesizes demo claims (theater).
4. **`FanectDemo.go` forces transitions** (presenter escape hatch), including tab-skip to pase — product tab path stays strict.
5. **No `tsc` / `dist/`** — browsers load `src/**/*.js` directly.
6. **Operator session** is in state defaults but not yet editable in the home UI (static copy in HTML still shown).

## Visual pass (dev)

- Tokens más cerrados (tipo, espacio, motion) aplicados a tarjetas del hub, CTAs, tab bar y errores.
- Jerarquía del hub: App Hincha en lima sólido; App Operador en tarjeta elevada con riel lima.
- Validación inline por campo en registro, consentimientos, ruta asistida, boleta y escáner.
- Estados vacíos en pase, decisión y auditoría.
- Marco sigue en 390px. Servir la raíz con `python3 -m http.server`.

## Known gaps

- Pseudo-QR only (not a real codec) — intentional honesty badge SIMULADO
- Provider mock timers not cancelled if user navigates away mid-flight via hash spam (leave hook clears timeout)
- verify-fanect-prototipo skill still points at v0/8765 — update separately if driving v1
- Pixel-perfect parity with every v0 flourish not guaranteed; happy paths prioritized
