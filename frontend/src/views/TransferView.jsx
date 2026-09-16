import { useMemo, useState } from 'react'
import { transactionsApi } from '../api/transactions'
import {
  Alert,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  LoadingState,
  inputClass,
  inputErrorClass,
} from '../components/ui'
import { formatMoney, fullName } from '../lib/format'

const EMPTY = { senderAccountNumber: '', receiverAccountNumber: '', amount: '' }

/**
 * Vista 2 — Transferencia de dinero.
 * POST /api/transactions con { senderAccountNumber, receiverAccountNumber, amount }.
 */
export function TransferView({ customers, loading, error, reload }) {
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  const sender = useMemo(
    () => customers.find((customer) => customer.accountNumber === values.senderAccountNumber),
    [customers, values.senderAccountNumber],
  )
  const receiver = useMemo(
    () => customers.find((customer) => customer.accountNumber === values.receiverAccountNumber),
    [customers, values.receiverAccountNumber],
  )

  function validate() {
    const next = {}
    const amount = Number(values.amount)

    if (!values.senderAccountNumber) next.senderAccountNumber = 'Selecciona la cuenta de origen.'
    if (!values.receiverAccountNumber) next.receiverAccountNumber = 'Selecciona la cuenta de destino.'
    if (
      values.senderAccountNumber &&
      values.senderAccountNumber === values.receiverAccountNumber
    ) {
      next.receiverAccountNumber = 'El origen y el destino deben ser diferentes.'
    }

    if (values.amount === '') next.amount = 'Ingresa el monto a transferir.'
    else if (Number.isNaN(amount)) next.amount = 'El monto debe ser numérico.'
    else if (amount <= 0) next.amount = 'El monto debe ser mayor que 0.'
    else if (sender && amount > Number(sender.balance)) {
      next.amount = `Saldo insuficiente: ${fullName(sender)} tiene ${formatMoney(sender.balance)}.`
    }

    return next
  }

  const setField = (name) => (event) => {
    setValues((prev) => ({ ...prev, [name]: event.target.value }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
    setResult(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    setResult(null)
    try {
      const transaction = await transactionsApi.transfer(values)
      setResult({
        tone: 'success',
        text: `Transferencia exitosa: ${formatMoney(transaction?.amount ?? values.amount)} de ${fullName(sender)} a ${fullName(receiver)}.`,
      })
      setValues(EMPTY)
      // Los saldos cambiaron en el backend: recarga la lista compartida.
      await reload()
    } catch (err) {
      setResult({ tone: 'error', text: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Card title="Transferencia de dinero">
        <LoadingState label="Cargando cuentas…" />
      </Card>
    )
  }

  if (error) {
    return (
      <Card title="Transferencia de dinero">
        <ErrorState message={error} onRetry={() => reload()} />
      </Card>
    )
  }

  if (customers.length < 2) {
    return (
      <Card title="Transferencia de dinero">
        <EmptyState
          title="Se necesitan al menos dos clientes"
          hint="Registra más cuentas en la vista de Clientes para poder transferir dinero."
        />
      </Card>
    )
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <Card title="Transferencia de dinero" description="Mueve fondos entre dos cuentas registradas.">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-5 py-5" noValidate>
          {result && (
            <Alert tone={result.tone} onDismiss={() => setResult(null)}>
              {result.text}
            </Alert>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Cuenta de origen"
              htmlFor="senderAccountNumber"
              error={errors.senderAccountNumber}
              hint={sender ? `Saldo disponible: ${formatMoney(sender.balance)}` : 'Desde dónde sale el dinero.'}
            >
              <select
                id="senderAccountNumber"
                value={values.senderAccountNumber}
                onChange={setField('senderAccountNumber')}
                className={`${inputClass} ${errors.senderAccountNumber ? inputErrorClass : ''}`}
                aria-invalid={Boolean(errors.senderAccountNumber)}
              >
                <option value="">Selecciona un cliente…</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.accountNumber}>
                    {fullName(customer)} · {customer.accountNumber}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Cuenta de destino"
              htmlFor="receiverAccountNumber"
              error={errors.receiverAccountNumber}
              hint={receiver ? `Saldo actual: ${formatMoney(receiver.balance)}` : 'Hacia dónde llega el dinero.'}
            >
              <select
                id="receiverAccountNumber"
                value={values.receiverAccountNumber}
                onChange={setField('receiverAccountNumber')}
                className={`${inputClass} ${errors.receiverAccountNumber ? inputErrorClass : ''}`}
                aria-invalid={Boolean(errors.receiverAccountNumber)}
              >
                <option value="">Selecciona un cliente…</option>
                {customers
                  .filter((customer) => customer.accountNumber !== values.senderAccountNumber)
                  .map((customer) => (
                    <option key={customer.id} value={customer.accountNumber}>
                      {fullName(customer)} · {customer.accountNumber}
                    </option>
                  ))}
              </select>
            </Field>
          </div>

          <Field label="Monto" htmlFor="amount" error={errors.amount} hint="Debe ser mayor que 0.">
            <input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              placeholder="0.00"
              value={values.amount}
              onChange={setField('amount')}
              className={`${inputClass} ${errors.amount ? inputErrorClass : ''}`}
              aria-invalid={Boolean(errors.amount)}
            />
          </Field>

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setValues(EMPTY)
                setErrors({})
                setResult(null)
              }}
              disabled={submitting}
            >
              Limpiar
            </Button>
            <Button type="submit" loading={submitting}>
              Transferir
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Resumen" description="Vista previa antes de confirmar.">
        <dl className="flex flex-col gap-4 px-5 py-5 text-sm">
          <PreviewRow label="Origen" value={sender ? fullName(sender) : '—'} sub={sender?.accountNumber} />
          <PreviewRow label="Destino" value={receiver ? fullName(receiver) : '—'} sub={receiver?.accountNumber} />
          <PreviewRow
            label="Monto"
            value={values.amount === '' ? '—' : formatMoney(values.amount)}
          />
          {sender && values.amount !== '' && !Number.isNaN(Number(values.amount)) && (
            <PreviewRow
              label="Saldo del origen tras la operación"
              value={formatMoney(Number(sender.balance) - Number(values.amount))}
            />
          )}
        </dl>
      </Card>
    </div>
  )
}

function PreviewRow({ label, value, sub }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-semibold text-slate-900">{value}</dd>
      {sub && <dd className="font-mono text-xs text-slate-500">{sub}</dd>}
    </div>
  )
}
