import { useEffect, useState } from 'react'
import { Modal } from './Modal'
import { Alert, Button, Field, inputClass, inputErrorClass } from './ui'

const EMPTY = { firstName: '', lastName: '', accountNumber: '', balance: '' }

function validate(values) {
  const errors = {}
  if (!values.firstName.trim()) errors.firstName = 'El nombre es obligatorio.'
  else if (values.firstName.trim().length > 50) errors.firstName = 'Máximo 50 caracteres.'

  if (!values.lastName.trim()) errors.lastName = 'El apellido es obligatorio.'
  else if (values.lastName.trim().length > 50) errors.lastName = 'Máximo 50 caracteres.'

  if (!values.accountNumber.trim()) errors.accountNumber = 'El número de cuenta es obligatorio.'

  if (values.balance === '') errors.balance = 'El saldo es obligatorio.'
  else if (Number.isNaN(Number(values.balance))) errors.balance = 'El saldo debe ser numérico.'
  else if (Number(values.balance) < 0) errors.balance = 'El saldo no puede ser negativo.'

  return errors
}

/**
 * Modal de creacion / edicion de cliente.
 * `customer` null => modo creacion (POST); con datos => modo edicion (PUT).
 */
export function CustomerFormModal({ open, customer, onClose, onSubmit }) {
  const isEdit = Boolean(customer)
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState(null)

  // Al abrir, sincroniza el formulario con el cliente seleccionado.
  useEffect(() => {
    if (!open) return
    setValues(
      customer
        ? {
            firstName: customer.firstName ?? '',
            lastName: customer.lastName ?? '',
            accountNumber: customer.accountNumber ?? '',
            balance: customer.balance ?? '',
          }
        : EMPTY,
    )
    setErrors({})
    setApiError(null)
  }, [open, customer])

  const setField = (name) => (event) => {
    setValues((prev) => ({ ...prev, [name]: event.target.value }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    setApiError(null)
    try {
      await onSubmit({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        accountNumber: values.accountNumber.trim(),
        balance: Number(values.balance),
      })
    } catch (error) {
      setApiError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar cliente' : 'Nuevo cliente'}
      description={
        isEdit ? `Actualizando los datos de ${customer.firstName} ${customer.lastName}.` : 'Registra un cliente y su cuenta.'
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {apiError && <Alert tone="error">{apiError}</Alert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre" htmlFor="firstName" error={errors.firstName}>
            <input
              id="firstName"
              value={values.firstName}
              onChange={setField('firstName')}
              className={`${inputClass} ${errors.firstName ? inputErrorClass : ''}`}
              aria-invalid={Boolean(errors.firstName)}
              autoComplete="off"
            />
          </Field>

          <Field label="Apellido" htmlFor="lastName" error={errors.lastName}>
            <input
              id="lastName"
              value={values.lastName}
              onChange={setField('lastName')}
              className={`${inputClass} ${errors.lastName ? inputErrorClass : ''}`}
              aria-invalid={Boolean(errors.lastName)}
              autoComplete="off"
            />
          </Field>
        </div>

        <Field
          label="Número de cuenta"
          htmlFor="accountNumber"
          error={errors.accountNumber}
          hint="Debe ser único; es la clave que usan las transferencias."
        >
          <input
            id="accountNumber"
            value={values.accountNumber}
            onChange={setField('accountNumber')}
            className={`${inputClass} ${errors.accountNumber ? inputErrorClass : ''}`}
            aria-invalid={Boolean(errors.accountNumber)}
            autoComplete="off"
          />
        </Field>

        <Field label="Saldo" htmlFor="balance" error={errors.balance}>
          <input
            id="balance"
            type="number"
            step="0.01"
            min="0"
            value={values.balance}
            onChange={setField('balance')}
            className={`${inputClass} ${errors.balance ? inputErrorClass : ''}`}
            aria-invalid={Boolean(errors.balance)}
          />
        </Field>

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" loading={submitting}>
            {isEdit ? 'Guardar cambios' : 'Crear cliente'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
