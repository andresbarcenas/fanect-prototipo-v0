# FANECT — Tribuna Segura (prototipo P0)

Prototipo estático clicable (HTML/CSS/JS) del happy path de hincha y del escáner de operador para el piloto de identidad digital + boleta nominativa.

**Marca:** FANECT · **Producto (provisional):** Tribuna Segura  
**Evento demo:** Evento demo — Club Alpha (ficticio; no es un club real)  
**Sin backend.** Todo el estado vive en memoria / `localStorage`. No hay integraciones reales.

---

## Cómo abrir

### Opción A — Servidor local (recomendado)

```bash
cd /workspace/fanect-prototipo-v0
python3 -m http.server 8765
```

Luego abre en el navegador: [http://127.0.0.1:8765/](http://127.0.0.1:8765/)

### Opción B — Archivo directo

Abre `index.html` con doble clic o arrástralo al navegador (`file://`). Funciona sin servidor.

Viewport pensado para ~390 px (móvil). En escritorio se muestra dentro de un marco tipo teléfono.

---

## Pantallas

### Hincha (flujo con indicador de progreso)

| # | Pantalla | Descripción |
|---|----------|-------------|
| 1 | Entrada evento | Código/link del evento cerrado (Club Alpha demo) |
| 2 | Registro | Campos mínimos (nombre, CC, celular, correo) |
| 3 | Consentimientos | Toggles separados: identidad, acceso, comunicaciones |
| 4 | Verificación | Elegir proveedor mock **o** ruta asistida no biométrica |
| 4b | Ruta asistida | Rama real P0: documento + selfie de control + aprobación agente |
| 4c | Proveedor mock | Spinner simulado (futuro integrado) |
| 5 | Resultado | Éxito de verificación |
| 6 | Fan Pass | Pass activado |
| 7 | Vincular boleta | Simulador de boletas nominativas |
| 8 | Pase + QR | QR dinámico con TTL y botón «Rotar QR» |

### Operador

| # | Pantalla | Descripción |
|---|----------|-------------|
| 9 | Escáner | Elegir estado demo del QR: válido / usado / expirado / replay |
| 10 | Decisión | ALLOW o DENY con motivo |
| 11 | Mini auditoría | Correlación hincha ↔ boleta ↔ QR ↔ decisión |

Barra inferior de demo: Inicio · Pase · Escáner.

---

## Happy path sugerido (demo fundador)

1. **Soy hincha — entrar al evento**
2. Continuar → Registro (valores precargados) → Continuar
3. Activar toggles **Identidad** y **Acceso** (Comunicaciones opcional) → Continuar
4. Elegir **Ruta asistida no biométrica** → dejar «Aprobado por agente» → Enviar
5. Activar Fan Pass → Vincular boleta (elegir una) → Ver pase + QR
6. Probar **Rotar QR** (cambia patrón y reinicia TTL)
7. Ir al escáner → probar los 4 estados → ver decisión y mini auditoría

Consola: `FanectDemo.reset()` limpia `localStorage` y recarga. `FanectDemo.go('pase')` salta a una pantalla.

---

## Fuera de P0 (no implementado)

- Facial 1:N
- Super-app
- Blockchain
- Venta de datos
- Consola completa de supervisor
- Backend / APIs reales

Las etiquetas **SIMULADO** / **RAMA P0** / **futuro integrado** marcan qué es mock vs. intención de producto.

---

## Archivos

```
fanect-prototipo-v0/
├── index.html   # SPA
├── styles.css   # Estética sports-tech (navy / verde)
├── app.js       # Navegación + estado
└── README.md
```


## Dirección de marca (provisional)

Basada en moodboard **01 — Deportiva** (no final):
- Mark F en 3 franjas verdes (oscuro → lima)
- Fondo negro / charcoal
- Tipografía display: Archivo Black; UI: Manrope
- Acento primario: lima `#c8ff3d`
