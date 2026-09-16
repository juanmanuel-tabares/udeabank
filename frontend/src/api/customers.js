import { http } from './http'

/**
 * Endpoints reales de CustomerController:
 *   GET    /api/customers
 *   GET    /api/customers/{id}
 *   POST   /api/customers
 *   PUT    /api/customers/{id}
 *   DELETE /api/customers/{id}
 *
 * Forma del CustomerDTO:
 *   { id, firstName, lastName, accountNumber, balance }
 */
export const customersApi = {
  list: (options) => http.get('/customers', options),
  getById: (id, options) => http.get(`/customers/${id}`, options),
  create: (customer, options) => http.post('/customers', customer, options),
  update: (id, customer, options) => http.put(`/customers/${id}`, customer, options),
  remove: (id, options) => http.delete(`/customers/${id}`, options),
}
