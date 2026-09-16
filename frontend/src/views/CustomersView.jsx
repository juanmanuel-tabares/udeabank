import { useMemo, useState } from 'react'
import { customersApi } from '../api/customers'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { CustomerFormModal } from '../components/CustomerFormModal'
import { Alert, Button, Card, EmptyState, ErrorState, LoadingState, inputClass } from '../components/ui'
import { formatMoney, fullName } from '../lib/format'

/**
 * Vista 1 — Gestion de clientes: listar, actualizar y eliminar.
 * (Se incluye "crear" porque el backend ya expone POST /api/customers y la
 * tabla queda inutil sin datos.)
 */
export function CustomersView({ customers, loading, error, reload }) {
  const [query, setQuery] = useState('')
  const [formState, setFormState] = useState({ open: false, customer: null })
  const [toDelete, setToDelete] = useState(null)
  const [feedback, setFeedback] = useState(null)

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return customers
    return customers.filter((customer) =>
      [customer.firstName, customer.lastName, customer.accountNumber]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    )
  }, [customers, query])

  const totalBalance = useMemo(
    () => customers.reduce((sum, customer) => sum + Number(customer.balance ?? 0), 0),
    [customers],
  )

  async function handleSubmit(values) {
    const editing = formState.customer
    if (editing) {
      await customersApi.update(editing.id, values)
      setFeedback({ tone: 'success', text: `Cliente "${values.firstName} ${values.lastName}" actualizado.` })
    } else {
      await customersApi.create(values)
      setFeedback({ tone: 'success', text: `Cliente "${values.firstName} ${values.lastName}" creado.` })
    }
    setFormState({ open: false, customer: null })
    await reload()
  }

  async function handleDelete() {
    await customersApi.remove(toDelete.id)
    setFeedback({ tone: 'success', text: `Cliente "${fullName(toDelete)}" eliminado.` })
    setToDelete(null)
    await reload()
  }

  return (
    <div className="flex flex-col gap-5">
      {feedback && (
        <Alert tone={feedback.tone} onDismiss={() => setFeedback(null)}>
          {feedback.text}
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <SummaryTile label="Clientes registrados" value={loading ? '—' : customers.length} />
        <SummaryTile label="Saldo total administrado" value={loading ? '—' : formatMoney(totalBalance)} />
      </div>

      <Card
        title="Clientes"
        description="Consulta, actualiza o elimina las cuentas registradas."
        actions={
          <>
            <Button variant="secondary" onClick={() => reload()} disabled={loading}>
              Refrescar
            </Button>
            <Button onClick={() => setFormState({ open: true, customer: null })}>Nuevo cliente</Button>
          </>
        }
      >
        <div className="border-b border-slate-200 px-5 py-3">
          <label htmlFor="search" className="sr-only">
            Buscar cliente
          </label>
          <input
            id="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre, apellido o número de cuenta…"
            className={inputClass}
          />
        </div>

        {loading && <LoadingState label="Cargando clientes…" />}
        {!loading && error && <ErrorState message={error} onRetry={() => reload()} />}
        {!loading && !error && filtered.length === 0 && (
          <EmptyState
            title={customers.length === 0 ? 'Aún no hay clientes' : 'Sin resultados'}
            hint={
              customers.length === 0
                ? 'Crea el primer cliente para empezar a registrar transferencias.'
                : 'Prueba con otro nombre o número de cuenta.'
            }
          />
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[42rem] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Cliente</th>
                  <th className="px-5 py-3 font-semibold">N.º de cuenta</th>
                  <th className="px-5 py-3 text-right font-semibold">Saldo</th>
                  <th className="px-5 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((customer) => (
                  <tr key={customer.id} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900">{fullName(customer)}</p>
                      <p className="text-xs text-slate-500">ID #{customer.id}</p>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-700">{customer.accountNumber}</td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-900">
                      {formatMoney(customer.balance)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          className="px-3 py-1.5"
                          onClick={() => setFormState({ open: true, customer })}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          className="px-3 py-1.5 text-rose-600 hover:bg-rose-50"
                          onClick={() => setToDelete(customer)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <CustomerFormModal
        open={formState.open}
        customer={formState.customer}
        onClose={() => setFormState({ open: false, customer: null })}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Eliminar cliente"
        message={
          toDelete
            ? `Se eliminará a ${fullName(toDelete)} (cuenta ${toDelete.accountNumber}). Esta acción no se puede deshacer.`
            : ''
        }
        onCancel={() => setToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}

function SummaryTile({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  )
}
