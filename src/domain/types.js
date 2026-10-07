/**
 * @typedef {'hub' | 'hincha' | 'operador'} AppContext
 *
 * @typedef {'hub' | 'hincha-home' | 'entrada' | 'registro' | 'consentimientos'
 *   | 'verificacion' | 'asistida' | 'proveedor' | 'resultado'
 *   | 'fanpass' | 'boleta' | 'pase'
 *   | 'operador-home' | 'scanner' | 'decision' | 'auditoria'} ScreenId
 *
 * @typedef {'asistida' | 'proveedor'} VerifyPath
 * @typedef {'valido' | 'usado' | 'expirado' | 'replay'} DemoFixture
 * @typedef {'valido' | 'usado' | 'expirado' | 'replay' | 'invalido'} QrEvalKind
 *
 * @typedef {{ nombre: string, doc: string, cel: string, email: string }} Registration
 * @typedef {{ identidad: boolean, acceso: boolean, comunicaciones: boolean }} Consents
 * @typedef {{ passId: string, nombre: string, eventLabel: string, status: 'activo', createdAt: number }} FanPass
 * @typedef {{ id: string, sector: string, fila: string, asiento: string, titular: string }} Ticket
 *
 * @typedef {{
 *   version: 0,
 *   eventCode: string,
 *   passId: string,
 *   ticketId: string,
 *   nonce: string,
 *   rotation: number,
 *   expiresAt: number
 * }} QrPayload
 *
 * @typedef {{
 *   eventCode: string,
 *   passId: string,
 *   ticketId: string,
 *   nonce: string,
 *   rotation: number,
 *   expiresAt: number,
 *   payload: QrPayload
 * }} QrSession
 *
 * @typedef {{
 *   allow: boolean,
 *   title: string,
 *   reason: string,
 *   at: string,
 *   passId: string,
 *   ticketId: string,
 *   nombre: string,
 *   qrNonce: string,
 *   correlationId: string,
 *   fixtureApplied: DemoFixture | null,
 *   kind: QrEvalKind,
 *   payloadSnapshot: QrPayload | null
 * }} Decision
 *
 * @typedef {{ operadorLabel: string, puerta: string, turno: string }} OperatorSession
 *
 * @typedef {{
 *   context: AppContext,
 *   screen: ScreenId,
 *   registration: Registration,
 *   consents: Consents,
 *   verifyPath: VerifyPath | null,
 *   fanPass: FanPass | null,
 *   ticket: Ticket | null,
 *   qrSession: QrSession | null,
 *   selectedFixture: DemoFixture | null,
 *   lastDecision: Decision | null,
 *   auditLog: Decision[],
 *   usedNonces: string[],
 *   redeemedTicketIds: string[],
 *   operator: OperatorSession,
 *   uiHint: string | null
 * }} AppState
 */

export {};
