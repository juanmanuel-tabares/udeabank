import { http } from './http'

/**
 * Endpoints reales de TransactionController:
 *   POST /api/transactions              -> transferencia
 *   GET  /api/transactions/{accountNumber} -> historico de una cuenta
 *
 * Forma del TransactionDTO:
 *   { id, senderAccountNumber, receiverAccountNumber, amount, timestamp }
 *
 * Ojo: el historico se consulta por NUMERO DE CUENTA, no por id de cliente.
 */
export const transactionsApi = {
  transfer: ({ senderAccountNumber, receiverAccountNumber, amount }, options) =>
    http.post(
      '/transactions',
      { senderAccountNumber, receiverAccountNumber, amount: Number(amount) },
      options,
    ),
  listByAccount: (accountNumber, options) =>
    http.get(`/transactions/${encodeURIComponent(accountNumber)}`, options),
}
