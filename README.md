# FANECT — Tribuna Segura (P0)

P0 estático clicable (HTML/CSS/JS). El MVP se presenta como **dos apps separadas** (Hincha y Operador) con un **hub** de entrada. No hay un flujo continuo que mezcle pantallas de hincha y operador.

**Marca:** FANECT · **Producto (provisional):** Tribuna Segura  
**Evento (default):** `MFC-DEMO-2026` — Millonarios vs Atlético Nacional · Liga BetPlay · El Campín · Bogotá · Sábado 20:00  
**Evento alterno:** `NAC-DEMO-2026` — Atlético Nacional vs Millonarios · Atanasio · Medellín · Jueves 19:30  
**Hub:** Elige App Hincha o App Operador. No hay un flujo continuo entre roles.  
**Sin backend.** Todo el estado vive en memoria / `localStorage`. No hay integraciones reales.

**Live:** [https://andresbarcenas.github.io/fanect-prototipo-v0/](https://andresbarcenas.github.io/fanect-prototipo-v0/)

---

## Arquitectura (T-09 / T-10 / T-11)

| Contexto | Pantalla de entrada | Tab bar |
|----------|---------------------|---------|
| **Hub** | `hub` | Oculta |
| **App Hincha** | `hincha-home` | Inicio · Pase · Beneficios · Perfil |
| **App Operador** | `operador-home` | Inicio · Escáner |

Desde el hub solo hay dos entradas: **App Hincha** y **App Operador**. «Cambiar de app» vuelve al hub. El QR del hincha **no** enlaza al escáner.

---

## Cómo abrir

### Opción A — GitHub Pages

[https://andresbarcenas.github.io/fanect-prototipo-v0/](https://andresbarcenas.github.io/fanect-prototipo-v0/)

### Opción B — Servidor local

```bash
cd fanect-prototipo-v0
python3 -m http.server 8765
```

Luego: [http://127.0.0.1:8765/](http://127.0.0.1:8765/)

### Opción C — Archivo directo

Abre `index.html` (`file://`).

---

## Marco iOS (T-16)

En escritorio el POC se centra en un marco tipo iPhone 14/15: bisel, Dynamic Island, barra de estado (hora, señal, batería), área segura y barra de inicio. En un viewport estrecho (≤520 px) el bisel, la isla y la barra de inicio se ocultan y la app ocupa el ancho, para que siga usable en un teléfono real. La interfaz usa la pila de sistema (`-apple-system`, `BlinkMacSystemFont`, `SF Pro Text`, `system-ui`); el wordmark sigue en Archivo Black. Un fundido corto acompaña el cambio de pantalla y no retrasa los timers.

Es solo chrome visual. No es PWA, Capacitor ni binario de App Store. El selector **UMBRAL | VÍNCULO | PULSO**, los tokens `--status-*` y los flujos no cambian. La franja amarilla de verificación se retiró (CSO, opción A).

---

## Pantallas

### Hub

| ID | Descripción |
|----|-------------|
| `hub` | Marca FANECT + dos tarjetas de entrada (Hincha / Operador) |

### App Hincha (progreso 1–8)

| # | ID | Descripción |
|---|-----|-------------|
| — | `hincha-home` | Primera visita: CTA «Entrar al evento». Con Fan Pass en `localStorage`: tablero (pase, categoría, última asistencia) |
| 1 | `entrada` | Código del evento. Chips `Evento: Millonarios` / `Evento: Nacional` |
| 2 | `registro` | Nombre, CC, celular, correo |
| 3 | `consentimientos` | Identidad / Acceso / Comunicaciones |
| 4 | `verificacion` | Proveedor de identidad **o** ruta asistida. Sin franja amarilla |
| 4b | `asistida` | Documento + selfie de control + agente |
| 4c | `proveedor` | Spinner del proveedor. Sigue el texto: no hay integración real |
| 5 | `resultado` | Identidad verificada |
| 6 | `fanpass` | Fan Pass activo |
| 7 | `boleta` | Vincular boleta nominativa. Etiqueta corta `Boleta Quentro`; el detalle va debajo de la lista |
| 8 | `pase` | QR dinámico + TTL, chip de categoría y acceso a beneficios (sin salto a operador) |
| — | `perfil` | Iniciales, datos enmascarados, Fan Pass, FP-ID, chips de consentimiento |
| — | `historial` | Partidos de la temporada. Sin badge en la fila y sin marcador oficial |
| — | `categoria` | Hincha verificado · Piloto, progreso hacia Frecuente, beneficios abiertos y cerrados |
| — | `beneficios` | QR, avisos, fila preferencial y servicios futuros (merch, contenido, apuestas) |
| — | `privacidad` | Datos de acceso fuera de publicidad, comunicaciones y acceso rápido opcionales |

### App Operador

| ID | Descripción |
|----|-------------|
| `operador-home` | Sesión de puerta. Puerta 3 · El Campín o Acceso Occidental · Atanasio, según el evento |
| `scanner` | Estados: válido / usado / expirado / replay |
| `decision` | ALLOW o DENY con motivo |
| `auditoria` | Correlación hincha ↔ boleta ↔ QR Fanect ↔ decisión. Incluye club, evento, `ticketId` y origen de boleta **Quentro** (sin API) |

---

## Happy path sugerido

1. En el **hub**, el texto pide elegir App Hincha o App Operador, sin flujo continuo entre roles. Abrir **App Hincha** → Entrar al evento  
2. El evento vigente es **Evento: Millonarios** (`MFC-DEMO-2026`, El Campín, sábado 20:00). El otro chip es **Evento: Nacional** (`NAC-DEMO-2026`, Atanasio, jueves 19:30)  
3. Registro (precargado) → consentimientos Identidad + Acceso → Continuar  
4. **Ruta asistida no biométrica** → «Aprobado por agente» → Enviar. Verificación, ruta asistida, proveedor y resultado no llevan franja amarilla  
5. Activar Fan Pass → **Ir a mi perfil** o Vincular boleta. En boleta, la etiqueta corta es `Boleta Quentro`; el texto largo queda debajo de la lista. IDs `T-MFC-*` o `T-NAC-*`  
6. Ver pase + QR Fanect (rotar TTL). **Perfil** → historial (sin marcador oficial) / categoría / privacidad, **Pase**, **Beneficios**  
7. Si ya hay Fan Pass o boleta y se toca el otro chip: «Cambia el evento y reinicia el pase». Confirmar borra pase, boleta y auditoría para no mezclar `T-MFC` con Nacional  
8. **Cambiar de app** → hub → **App Operador** → Abrir escáner  
9. Probar los 4 estados → decisión → mini auditoría (origen de boleta: Quentro)  

Deep links (el alias no aparece en los chips):

- `?event=NAC-DEMO-2026` o `?club=nacional`
- `?event=MFC-DEMO-2026` o `?club=millonarios`
- `?event=CLASICO-DEMO-2026` resuelve al evento vigente Millonarios. Con `club=nacional`, resuelve a Nacional

Para volver al home de primera visita: `FanectDemo.reset()`.

Consola: `FanectDemo.reset()` · `FanectDemo.go('perfil')` · `FanectDemo.state.app`

---

## Millonarios, Nacional y Quentro (sin licencia de marca)

Nombres comerciales públicos para la narrativa. No hay licencia de escudo, tipografía, kit ni logo de Millonarios FC ni de Atlético Nacional, y este POC no incrusta esos assets. Los colores `#0B3D91` (Millonarios) y `#0B7A3B` (Nacional) son placeholders y **solo** pintan los chips y labels del evento (`Evento: Millonarios`, `Evento: Nacional`). No cambian la marca FANECT (UMBRAL / VÍNCULO / PULSO), el selector de ruta, el TTL, ni los tokens `--status-*` de permitir, denegar, revisión o usado.

Los chips dicen **Evento:** (o el local del partido). No dicen «Soy Millonarios» ni «Soy Nacional»: no afirma afiliación del hincha.

**Quentro** (Crowder) se muestra como fuente de la boleta nominativa: hoy el hincha compra en la tiquetera del club (Entradas Millonarios o Tribuna Verde) y la entrada se acredita en Quentro. FANECT no reemplaza esa billetera y **no** hay API, webhook ni app Quentro conectada. El QR que abre la puerta del piloto es el **QR Fanect**. La auditoría muestra el origen como **Quentro**.

Códigos en la UI, solo dos: `MFC-DEMO-2026` (default) y `NAC-DEMO-2026`. `CLASICO-DEMO-2026` no es un tercer evento ni un chip; únicamente un deep link que abre el evento vigente.

Boletas de ejemplo: `T-MFC-NORTE-12-08`, `T-MFC-SUR-05-21`, `T-MFC-OCC-A-14` en El Campín; `T-NAC-OCC-B-10`, `T-NAC-ORI-A-22`, `T-NAC-NORTE-08-15` en el Atanasio. Titular precargado: Andrés Díaz.

Historial de ejemplo (fechas de narrativa, rivales de narrativa, **sin marcador real**). La línea sigue siendo «Marcador ficticio · no es un resultado oficial».

Si el usuario cambia de evento cuando ya existe Fan Pass o boleta, no reescribe la boleta del otro club. Pide confirmación con el texto «Cambia el evento y reinicia el pase» y, al confirmar, borra pase, boleta, QR y auditoría.

El detalle legal de marca vive en esta sección. En el hub solo aparece la línea corta bajo el bloque de marca.

## Fuera de P0 (no implementado)

- Facial 1:N
- Super-app
- Blockchain
- Venta de datos
- Consola completa de supervisor
- Backend / APIs reales
- API o app de Quentro (el bind de boleta no llama a un servicio)
- Logos, escudos o brand kits oficiales de los clubes

Etiquetas **RAMA P0** / **HINCHA** / **OPERADOR** marcan la rama del piloto y el contexto de app.

---

## Archivos

```
fanect-prototipo-v0/
├── index.html
├── styles.css
├── app.js
├── assets/fanect-mark.svg
├── assets/fanect-f.svg
└── README.md
```

## Dirección de marca (provisional)

Tres rutas del board **Fanect / tres rutas de identidad** (30 sep 2026). Ninguna es la marca oficial. El selector **UMBRAL | VÍNCULO | PULSO** está fijo en el marco (hub, Hincha y Operador) y persiste en `localStorage` (`fanect_theme`). Cambiar de ruta no navega ni borra el flujo; un reload normal restaura la última ruta y el estado ya guardado.

**Tema por defecto: `umbral`** (fondo oscuro de la ruta A). Es el más cercano al POC oscuro anterior. El lima deportivo (`#c8ff3d`) ya no pinta superficies ni estados.

| Ruta | Fondo oscuro | Acento (board) | Símbolo |
|------|----------------|----------------|---------|
| UMBRAL | `#121a24` | coral `#f04e23` en la barra superior de la F | F geométrica de 3 barras |
| VÍNCULO | `#0e1628` | royal `#2f5bff` (texto/símbolo en el mismo tono, más claro: `#8eaaff`) | ojo / hoja de dos trazos |
| PULSO | `#120c16` | magenta `#c2185b` (texto/símbolo `#f472b6`) | dos barras diagonales |

El lienzo de escritorio usa el fondo claro del board (`--canvas`). La app dentro del teléfono usa el fondo oscuro. Tipografía: Archivo Black (wordmark) y la pila de sistema, tipo SF Pro, para la UI. Sin tagline.

### Estados que no siguen la marca

Los tokens `--status-*` viven en `:root` y **no** se redefinen en `[data-theme]`.

| Estado | Color fijo |
|--------|------------|
| Permitir / VÁLIDO / ACTIVO | verde |
| Denegar | rojo |
| Replay (revisión) | ámbar |
| Usado / expirado | gris |
| `--status-sim-*` | amarillo `#ffe14a` sobre negro `#14120a`, definido en `:root` y sin etiqueta en la UI |
| RAMA P0 | gris pizarra, aparte del acento |

`--status-sim-*` no se reasigna con la marca. La UI ya no muestra esa franja en verificación, ruta asistida, proveedor ni resultado (CSO, opción A). En DIMAYOR la identidad se explica de palabra: se productiza tras el PoC y un DPA. Eso no va en la interfaz. El QR es blanco y negro; el badge de validez usa el verde o el gris de estado.
