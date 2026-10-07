/** @typedef {import('./types.js').DemoFixture} DemoFixture */

/** @type {Record<DemoFixture | 'invalido', { allow: boolean, title: string, reason: string }>} */
export const DECISION_COPY = {
  valido: {
    allow: true,
    title: "PERMITIR INGRESO",
    reason: "QR válido · boleta nominativa vinculada · TTL vigente",
  },
  usado: {
    allow: false,
    title: "DENEGAR INGRESO",
    reason: "Boleta ya utilizada (estado: usado)",
  },
  expirado: {
    allow: false,
    title: "DENEGAR INGRESO",
    reason: "QR expirado (TTL agotado)",
  },
  replay: {
    allow: false,
    title: "DENEGAR INGRESO",
    reason: "Replay detectado · token QR ya presentado",
  },
  invalido: {
    allow: false,
    title: "DENEGAR INGRESO",
    reason: "Payload inválido o evento desconocido",
  },
};
