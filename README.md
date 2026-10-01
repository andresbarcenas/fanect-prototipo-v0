# FANECT — Tribuna Segura (prototipo P0)

Prototipo estático clicable (HTML/CSS/JS) para demo institucional. El MVP se presenta como **dos apps separadas** (Hincha y Operador) con un **hub** de entrada. No hay un flujo continuo que mezcle pantallas de hincha y operador.

**Marca:** FANECT · **Producto (provisional):** Tribuna Segura  
**Evento demo:** Evento demo — Club Alpha (ficticio; no es un club real)  
**Sin backend.** Todo el estado vive en memoria / `localStorage`. No hay integraciones reales.

**Live:** [https://andresbarcenas.github.io/fanect-prototipo-v0/](https://andresbarcenas.github.io/fanect-prototipo-v0/)

---

## Arquitectura de la demo (T-09 / T-10 / T-11)

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

Abre `index.html` (`file://`). Viewport ~390 px; en escritorio se muestra en marco tipo teléfono.

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
| 1 | `entrada` | Código/link del evento (Club Alpha demo) |
| 2 | `registro` | Nombre, CC, celular, correo |
| 3 | `consentimientos` | Identidad / Acceso / Comunicaciones |
| 4 | `verificacion` | Proveedor mock **o** ruta asistida |
| 4b | `asistida` | Documento + selfie de control + agente |
| 4c | `proveedor` | Spinner simulado |
| 5 | `resultado` | Identidad verificada |
| 6 | `fanpass` | Fan Pass activo |
| 7 | `boleta` | Vincular boleta nominativa |
| 8 | `pase` | QR dinámico + TTL, chip de categoría y acceso a beneficios (sin salto a operador) |
| — | `perfil` | Iniciales, datos enmascarados, Fan Pass, FP-ID, chips de consentimiento |
| — | `historial` | Partidos asistidos de demostración y contador de temporada |
| — | `categoria` | Hincha verificado · Piloto, progreso hacia Frecuente, beneficios abiertos y cerrados |
| — | `beneficios` | QR, avisos, fila preferencial y servicios futuros (merch, contenido, apuestas) |
| — | `privacidad` | Datos de acceso fuera de publicidad, comunicaciones y acceso rápido opcionales |

### App Operador

| ID | Descripción |
|----|-------------|
| `operador-home` | Sesión mock (operador / puerta / turno) + «Abrir escáner» |
| `scanner` | Estados demo: válido / usado / expirado / replay |
| `decision` | ALLOW o DENY con motivo |
| `auditoria` | Correlación hincha ↔ boleta ↔ QR ↔ decisión |

---

## Happy path sugerido

1. En el **hub**, abrir **App Hincha** → Entrar al evento  
2. Registro (precargado) → consentimientos Identidad + Acceso → Continuar  
3. **Ruta asistida no biométrica** → «Aprobado por agente» → Enviar  
4. Activar Fan Pass → **Ir a mi perfil** o Vincular boleta → ver pase + QR (rotar TTL)  
5. Con el Fan Pass guardado, **Inicio** muestra el tablero. Recorrido del slide: **Perfil** → historial / categoría / privacidad, **Pase**, **Beneficios**  
6. **Cambiar de app** → hub → **App Operador** → Abrir escáner  
7. Probar los 4 estados → decisión → mini auditoría  

Para volver al home de primera visita: `FanectDemo.reset()`.

Consola: `FanectDemo.reset()` · `FanectDemo.go('perfil')` · `FanectDemo.state.app`

---

## Fuera de P0 (no implementado)

- Facial 1:N
- Super-app
- Blockchain
- Venta de datos
- Consola completa de supervisor
- Backend / APIs reales

Etiquetas **SIMULADO** / **RAMA P0** / **HINCHA** / **OPERADOR** marcan mock vs. contexto de app.

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

Tres rutas del board **Fanect / tres rutas de identidad** (30 sep 2026). Ninguna es la marca oficial. El selector **UMBRAL | VÍNCULO | PULSO** está fijo en el marco (hub, Hincha y Operador) y persiste en `localStorage` (`fanect_theme`). Cambiar de ruta no navega ni borra el flujo; un reload normal restaura la última ruta y el estado ya guardado del demo.

**Tema por defecto: `umbral`** (fondo oscuro de la ruta A). Es el más cercano al POC oscuro anterior. El lima deportivo (`#c8ff3d`) ya no pinta superficies ni estados.

| Ruta | Fondo oscuro | Acento (board) | Símbolo |
|------|----------------|----------------|---------|
| UMBRAL | `#121a24` | coral `#f04e23` en la barra superior de la F | F geométrica de 3 barras |
| VÍNCULO | `#0e1628` | royal `#2f5bff` (texto/símbolo en el mismo tono, más claro: `#8eaaff`) | ojo / hoja de dos trazos |
| PULSO | `#120c16` | magenta `#c2185b` (texto/símbolo `#f472b6`) | dos barras diagonales |

El lienzo de escritorio usa el fondo claro del board (`--canvas`). La app dentro del teléfono usa el fondo oscuro. Tipografía: Archivo Black (wordmark) y Manrope (UI). Sin tagline.

### Estados que no siguen la marca

Los tokens `--status-*` viven en `:root` y **no** se redefinen en `[data-theme]`.

| Estado | Color fijo |
|--------|------------|
| Permitir / VÁLIDO / ACTIVO | verde |
| Denegar | rojo |
| Replay (revisión) | ámbar |
| Usado / expirado | gris |
| DEMO · SIMULADO | amarillo `#ffe14a` sobre negro `#14120a` |
| RAMA P0 | gris pizarra, aparte del acento |

La franja **DEMO · SIMULADO** está en verificación, ruta asistida, proveedor mock y resultado. No usa el coral de UMBRAL ni el magenta de PULSO, y no parece un verde de KYC aprobado. El QR es blanco y negro; el badge de validez usa el verde o el gris de estado.
