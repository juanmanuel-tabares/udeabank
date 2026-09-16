import { useState } from 'react'
import { Modal } from './Modal'
import { Alert, Button } from './ui'

/**
 * Confirmacion para acciones destructivas (eliminar cliente).
 * `onConfirm` puede ser async: el boton muestra spinner hasta que resuelve.
 */
export function ConfirmDialog({ open, title, message, confirmLabel = 'Eliminar', onCancel, onConfirm }) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function handleConfirm() {
    setSubmitting(true)
    setError(null)
    try {
      await onConfirm()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function handleCancel() {
    setError(null)
    onCancel()
  }

  return (
    <Modal open={open} onClose={handleCancel} title={title}>
      <div className="flex flex-col gap-4">
        {error && <Alert tone="error">{error}</Alert>}
        <p className="text-sm text-slate-600">{message}</p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={handleCancel} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="button" variant="danger" onClick={handleConfirm} loading={submitting}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
