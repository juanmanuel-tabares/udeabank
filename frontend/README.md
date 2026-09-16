# UdeaBank · Frontend

Interfaz web para el backend Spring Boot de `lab1arq`. Tres vistas: gestión de
clientes, transferencias e histórico de transacciones.

**Stack:** React 19 + Vite + Tailwind CSS v4 + React Router + `fetch`.

---

## Cómo ejecutarlo

### 1. Backend (desde la raíz del repo)

```bash
./mvnw spring-boot:run
```

Queda en `http://localhost:8080`. Necesita MySQL corriendo con la base
`udeabank` (ver `src/main/resources/application.properties`).

### 2. Frontend

```bash
cd frontend && npm install && npm run dev
```

Queda en `http://localhost:5173`.

Otros comandos: `npm run build` (compila a `dist/`) y `npm run preview`
(sirve el build en `http://localhost:4173`).

---

## Configurar la URL base de la API

Copia `.env.example` a `.env` y ajusta:

| Variable | Por defecto | Para qué sirve |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/api` | Prefijo que usa el cliente HTTP. |
| `VITE_API_PROXY_TARGET` | `http://localhost:8080` | Backend al que el dev server reenvía `/api`. Solo aplica en `npm run dev`. |

Hay dos formas de conectarse:

**a) Proxy de Vite (por defecto, recomendado en desarrollo).** El navegador pide
`/api/...` al propio servidor de Vite, que lo reenvía al backend. No hay CORS de
por medio. Solo cambia `VITE_API_PROXY_TARGET` si el backend no está en el 8080.

**b) URL absoluta.** Apunta directo al backend:

```bash
VITE_API_BASE_URL=http://localhost:8080/api
```

En este caso sí hay CORS. `src/main/java/com/udea/lab1arq/config/CorsConfig.java`
acepta cualquier puerto de `localhost` / `127.0.0.1` mediante
`allowedOriginPatterns`, así que sirve aunque Vite arranque en 5174, 5175, etc.
Para desplegar en otro host, añade ese origen al patrón.

---

## Endpoints consumidos

| Método | Ruta | Uso en la UI |
| --- | --- | --- |
| `GET` | `/api/customers` | Tabla de clientes, selectores de transferencia e histórico |
| `POST` | `/api/customers` | Modal "Nuevo cliente" |
| `PUT` | `/api/customers/{id}` | Modal "Editar cliente" |
| `DELETE` | `/api/customers/{id}` | Botón "Eliminar" con confirmación |
| `POST` | `/api/transactions` | Formulario de transferencia |
| `GET` | `/api/transactions/{accountNumber}` | Histórico del cliente seleccionado |

> Ojo: el histórico se consulta por **número de cuenta**, no por id de cliente.
> La vista traduce el cliente elegido a su `accountNumber` antes de llamar.

---

## Estructura

```
src/
├─ api/
│  ├─ http.js            Cliente fetch: URL base, errores tipados, parseo JSON/texto
│  ├─ customers.js       Endpoints de clientes
│  └─ transactions.js    Endpoints de transacciones
├─ components/
│  ├─ ui.jsx             Spinner, estados de carga/error/vacío, Alert, Card, Button, Field
│  ├─ Modal.jsx          Modal accesible sobre <dialog> (Escape + clic en backdrop)
│  ├─ CustomerFormModal.jsx  Formulario crear/editar con validación
│  └─ ConfirmDialog.jsx  Confirmación para acciones destructivas
├─ hooks/useCustomers.js Estado compartido de clientes (carga + recarga)
├─ lib/format.js         Formato de moneda, fecha y nombre completo
├─ views/
│  ├─ CustomersView.jsx  Vista 1 — listar, buscar, crear, editar, eliminar
│  ├─ TransferView.jsx   Vista 2 — transferencia con validación y resumen en vivo
│  └─ HistoryView.jsx    Vista 3 — histórico por cliente con totales
└─ App.jsx               Layout, navegación y rutas
```

## Manejo de estados

- **Carga:** spinner por vista y por acción (los botones muestran spinner y se
  deshabilitan mientras la petición está en vuelo).
- **Errores de red:** `http.js` distingue un fallo de conexión (backend caído o
  CORS) de un error HTTP, y muestra un mensaje accionable con botón "Reintentar".
- **Errores de negocio:** el backend responde texto plano en los 400
  (p. ej. "Saldo insuficiente…"); el cliente lo detecta por `Content-Type` y lo
  muestra tal cual en la alerta del formulario.
- **Vacíos:** mensajes dedicados cuando no hay clientes, no hay resultados de
  búsqueda o la cuenta no tiene movimientos.
