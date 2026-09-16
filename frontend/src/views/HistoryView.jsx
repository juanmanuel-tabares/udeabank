import { useCallback, useEffect, useMemo, useState } from 'react'
import { transactionsApi } from '../api/transactions'
import { Button, Card, EmptyState, ErrorState, Field, LoadingState, inputClass } from '../components/ui'
import { formatDateTime, formatMoney, fullName } from '../lib/format'

/**
 * Vista 3 — Historico de transacciones por cliente.
 *
 * El backend expone GET /api/transactions/{accountNumber}, asi que el selector
 * de cliente se traduce a su numero de cuenta antes de consultar.
 *
 * El DTO no trae un campo "estado": toda transaccion persistida ya se ejecuto
 * con exito (las fallidas se rechazan con 400 y no se guardan), de modo que la
 * columna Estado se deriva como "Completada".
 */
export function HistoryView({ customers, loading: loadingCustomers, error: customersError, reload }) {
  const [accountNumber, setAccountNumber] = useState('')
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const selected = useMemo(
    () => customers.find((customer) => customer.accountNumber === accountNumber),
    [customers, accountNumber],
  )

  const fetchHistory = useCallback(async (account, signal) => {
    if (!account) {
      setTransactions([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await transactionsApi.listByAccount(account, { signal })
      const list = Array.isArray(data) ? data : []
      // Mas recientes primero; el backend no garantiza orden.
      list.sort((a, b) => new Date(b.timestamp ?? 0) - new Date(a.timestamp ?? 0))
      setTransactions(list)
    } catch (err) {
      if (err.name === 'AbortError') return
      setError(err.message)
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetchHistory(accountNumber, controller.signal)
    return () => controller.abort()
  }, [accountNumber, fetchHistory])

  const totals = useMemo(() => {
    let incoming = 0
    let outgoing = 0
    for (const transaction of transactions) {
      const amount = Number(transaction.amount ?? 0)
      if (transaction.receiverAccountNumber === accountNumber) incoming += amount
      if (transaction.senderAccountNumber === accountNumber) outgoing += amount
    }
    return { incoming, outgoing }
  }, [transactions, accountNumber])

  if (loadingCustomers) {
    return (
      <Card title="Histórico de transacciones">
        <LoadingState label="Cargando clientes…" />
      </Card>
    )
  }

  if (customersError) {
    return (
      <Card title="Histórico de transacciones">
        <ErrorState message={customersError} onRetry={() => reload()} />
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <Card title="Histórico de transacciones" description="Selecciona un cliente para ver su movimiento de cuenta.">
        <div className="grid gap-4 px-5 py-5 sm:grid-cols-[minmax(0,24rem)_auto] sm:items-end">
          <Field label="Cliente" htmlFor="customer" hint="El histórico se consulta por número de cuenta.">
            <select
              id="customer"
              value={accountNumber}
              onChange={(event) => setAccountNumber(event.target.value)}
              className={inputClass}
            >
              <option value="">Selecciona un cliente…</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.accountNumber}>
                  {fullName(customer)} · {customer.accountNumber}
                </option>
              ))}
            </select>
          </Field>
          <Button
            variant="secondary"
            className="justify-self-start"
            onClick={() => fetchHistory(accountNumber)}
            disabled={!accountNumber || loading}
          >
            Refrescar
          </Button>
        </div>
      </Card>

      {accountNumber && !loading && !error && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile label="Saldo actual" value={formatMoney(selected?.balance)} />
          <StatTile label="Total recibido" value={formatMoney(totals.incoming)} tone="emerald" />
          <StatTile label="Total enviado" value={formatMoney(totals.outgoing)} tone="rose" />
        </div>
      )}

      <Card
        title={selected ? `Movimientos de ${fullName(selected)}` : 'Movimientos'}
        description={selected ? `Cuenta ${selected.accountNumber}` : undefined}
      >
        {!accountNumber && (
          <EmptyState title="Ningún cliente seleccionado" hint="Elige un cliente arriba para cargar su histórico." />
        )}
        {accountNumber && loading && <LoadingState label="Cargando transacciones…" />}
        {accountNumber && !loading && error && (
          <ErrorState message={error} onRetry={() => fetchHistory(accountNumber)} />
        )}
        {accountNumber && !loading && !error && transactions.length === 0 && (
          <EmptyState
            title="Sin transacciones"
            hint="Esta cuenta todavía no ha enviado ni recibido dinero."
          />
        )}

        {accountNumber && !loading && !error && transactions.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Fecha</th>
                  <th className="px-5 py-3 font-semibold">Tipo</th>
                  <th className="px-5 py-3 font-semibold">Cuenta origen</th>
                  <th className="px-5 py-3 font-semibold">Cuenta destino</th>
                  <th className="px-5 py-3 text-right font-semibold">Monto</th>
                  <th className="px-5 py-3 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((transaction) => {
                  const isIncoming = transaction.receiverAccountNumber === accountNumber
                  return (
                    <tr key={transaction.id} className="transition hover:bg-slate-50/70">
                      <td className="px-5 py-3 whitespace-nowrap text-slate-600">
                        {formatDateTime(transaction.timestamp)}
                      </td>
                      <td className="px-5 py-3">
                        <Badge tone={isIncoming ? 'emerald' : 'amber'}>
                          {isIncoming ? 'Recibida' : 'Enviada'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-slate-700">
                        {transaction.senderAccountNumber}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-slate-700">
                        {transaction.receiverAccountNumber}
                      </td>
                      <td
                        className={`px-5 py-3 text-right font-semibold ${
                          isIncoming ? 'text-emerald-600' : 'text-slate-900'
                        }`}
                      >
                        {isIncoming ? '+' : '−'} {formatMoney(transaction.amount)}
                      </td>
                      <td className="px-5 py-3">
                        <Badge tone="slate">Completada</Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

function StatTile({ label, value, tone = 'slate' }) {
  const tones = {
    slate: 'text-slate-900',
    emerald: 'text-emerald-600',
    rose: 'text-rose-600',
  }
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${tones[tone]}`}>{value}</p>
    </div>
  )
}

function Badge({ tone = 'slate', children }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-600',
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
  }
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>
  )
}
