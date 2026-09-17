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
| **App Hincha** | `hincha-home` | Inicio · Pase |
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
| — | `hincha-home` | Home corto + CTA «Entrar al evento» |
| 1 | `entrada` | Código/link del evento (Club Alpha demo) |
| 2 | `registro` | Nombre, CC, celular, correo |
| 3 | `consentimientos` | Identidad / Acceso / Comunicaciones |
| 4 | `verificacion` | Proveedor mock **o** ruta asistida |
| 4b | `asistida` | Documento + selfie de control + agente |
| 4c | `proveedor` | Spinner simulado |
| 5 | `resultado` | Identidad verificada |
| 6 | `fanpass` | Fan Pass activo |
| 7 | `boleta` | Vincular boleta nominativa |
| 8 | `pase` | QR dinámico + TTL (sin salto a operador) |

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
4. Activar Fan Pass → Vincular boleta → ver pase + QR (rotar TTL)  
5. **Cambiar de app** → hub → **App Operador** → Abrir escáner  
6. Probar los 4 estados → decisión → mini auditoría  

Consola: `FanectDemo.reset()` · `FanectDemo.go('pase')` · `FanectDemo.state.app`

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

Basada en moodboard **01 — Deportiva** (no final):
- Mark F en 3 franjas verdes (oscuro → lima)
- Fondo negro / charcoal
- Tipografía display: Archivo Black; UI: Manrope
- Acento primario: lima `#c8ff3d`
