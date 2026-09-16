const currency = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 2,
})

const dateTime = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

/** Formatea un Double del backend como moneda. */
export function formatMoney(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  return currency.format(Number(value))
}

/**
 * El backend serializa LocalDateTime como "2026-09-15T10:32:04" (sin zona).
 * Date lo interpreta como hora local, que es justo lo que queremos aqui.
 */
export function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return dateTime.format(date)
}

export function fullName(customer) {
  if (!customer) return '—'
  return [customer.firstName, customer.lastName].filter(Boolean).join(' ') || '—'
}
