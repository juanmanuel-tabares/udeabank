/**
 * Cliente HTTP minimo sobre fetch.
 *
 * La URL base se toma de VITE_API_BASE_URL (ver .env.example). Por defecto es
 * "/api", que el dev server de Vite reenvia al backend de Spring Boot.
 */
export const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

/** Error de API con el status HTTP para poder diferenciar 4xx de 5xx en la UI. */
export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/**
 * El backend responde JSON en los casos felices y texto plano en los errores
 * de negocio (`ResponseEntity.badRequest().body(e.getMessage())`), asi que hay
 * que leer el cuerpo segun el Content-Type real.
 */
async function parseBody(response) {
  const raw = await response.text()
  if (!raw) return null

  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(raw)
    } catch {
      return raw
    }
  }
  return raw
}

async function request(path, { method = 'GET', body, signal } = {}) {
  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    // fetch solo rechaza por fallos de red/CORS, no por status HTTP.
    throw new ApiError(
      `No se pudo conectar con la API (${BASE_URL}). Verifica que el backend este corriendo.`,
      0,
    )
  }

  const payload = await parseBody(response)

  if (!response.ok) {
    const message =
      typeof payload === 'string' && payload.trim()
        ? payload
        : payload?.message || `Error ${response.status} al llamar ${method} ${path}`
    throw new ApiError(message, response.status)
  }

  return payload
}

export const http = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
}
