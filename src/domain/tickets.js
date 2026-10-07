/** @typedef {import('./types.js').Ticket} Ticket */

/** @type {readonly Ticket[]} */
export const TICKETS = Object.freeze([
  { id: "T-NORTE-12-08", sector: "Tribuna Norte", fila: "12", asiento: "08", titular: "Andrés Demo" },
  { id: "T-SUR-05-21", sector: "Tribuna Sur", fila: "05", asiento: "21", titular: "Andrés Demo" },
  { id: "T-ORIENTE-A-14", sector: "Preferencial Oriente", fila: "A", asiento: "14", titular: "Andrés Demo" },
]);

/** @param {string} id */
export function findTicket(id) {
  return TICKETS.find((t) => t.id === id) || null;
}
