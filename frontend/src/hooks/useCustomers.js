import { useCallback, useEffect, useState } from 'react'
import { customersApi } from '../api/customers'

/**
 * Carga la lista de clientes y expone helpers para refrescarla.
 * Se comparte entre las tres vistas (listado, transferencia e historico).
 */
export function useCustomers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const reload = useCallback(async (signal) => {
    setLoading(true)
    setError(null)
    try {
      const data = await customersApi.list({ signal })
      setCustomers(Array.isArray(data) ? data : [])
    } catch (err) {
      if (err.name === 'AbortError') return
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    reload(controller.signal)
    return () => controller.abort()
  }, [reload])

  return { customers, loading, error, reload, setCustomers }
}
