# FANECT — Tribuna Segura (prototipo v1)

Demo institucional clicable, en español. **Sin backend** y sin Vite/npm: módulos ES nativos y `localStorage`. En esta rama el prototipo v1 es la app servida en la raíz.

Dos productos y un hub. No hay un flujo continuo entre hincha y operador:

1. **App Hincha** — registro, consentimientos, verificación (asistida P0), Fan Pass, boleta nominativa y QR dinámico.
2. **App Operador** — escáner, decisión ALLOW/DENY y mini auditoría.

El operador evalúa el mismo `QrPayload` que emite el hincha (`QrCodec`). Los estados demo (válido, usado, expirado, replay) siguen disponibles como override. Evento: **Evento demo — Club Alpha** (`ALPHA-DEMO-2026`). Todo es simulado; la UI lo marca con **SIMULADO**.

## Cómo correr

Desde la raíz del repo:

```bash
python3 -m http.server
```

Abre [http://127.0.0.1:8000/](http://127.0.0.1:8000/).

No abras `index.html` con `file://`: los módulos ES no cargan y `localStorage` puede partirse por archivo.

## Consola

```js
FanectDemo.go("pase")   // navegación forzada (escape hatch)
FanectDemo.rotateQr()
FanectDemo.state        // proyección de solo lectura
FanectDemo.reset()      // limpia fanect_p1 (+ legacy fanect_p0) y recarga
```

El arranque vuelve siempre al hub. La ruta vive en el hash: `#/hub`, `#/hincha/…`, `#/operador/…`.

## Invariantes de la demo

- Hub + App Hincha + App Operador, solo mock.
- Club Alpha. Sin integraciones reales.
- Selectores estables: `#screen-*`, `[data-go]`, `#btnScan`, `#decisionBanner`, `#qrCanvas`.
- API `FanectDemo` (`go`, `rotateQr`, `state`, `reset`).

## Arquitectura

```
index.html          pantallas estáticas + marco ~390px
styles/tokens.css   tipo, espacio, color, motion
styles/base.css     layout del teléfono, estados, tab bar
src/app/            bootstrap, AppController, Router, ViewHost
src/domain/         types, machine, QrCodec, tickets, decisions
src/persist/        schema v2 (fanect_p1) + Store
src/views/          binders finos por pantalla
src/ui/             validación inline, tab bar, progreso
assets/             marca
```

`AppController` es el único que escribe estado. Las vistas pintan. El detalle de desviaciones del sketch está en `IMPLEMENTATION.md`.

## Marco

En escritorio la demo cabe en un marco de **390px**. En un viewport ≤420px el marco ocupa el ancho, para un teléfono real. La pila de UI es Manrope; el wordmark sigue en Archivo Black. Un fundido corto acompaña el cambio de pantalla y se apaga con `prefers-reduced-motion`.
