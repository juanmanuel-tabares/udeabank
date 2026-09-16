import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { BASE_URL } from './api/http'
import { useCustomers } from './hooks/useCustomers'
import { CustomersView } from './views/CustomersView'
import { HistoryView } from './views/HistoryView'
import { TransferView } from './views/TransferView'

const NAV = [
  { to: '/clientes', label: 'Clientes' },
  { to: '/transferencia', label: 'Transferencia' },
  { to: '/historico', label: 'Histórico' },
]

export default function App() {
  // Un solo origen de verdad para la lista de clientes: las tres vistas la
  // comparten y cualquier mutacion (editar, borrar, transferir) la refresca.
  const { customers, loading, error, reload } = useCustomers()
  const shared = { customers, loading, error, reload }

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white">
              UB
            </span>
            <div>
              <p className="text-base font-semibold leading-tight">UdeaBank</p>
              <p className="text-xs text-slate-500">Panel de administración</p>
            </div>
          </div>

          <nav className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Routes>
          <Route path="/" element={<Navigate to="/clientes" replace />} />
          <Route path="/clientes" element={<CustomersView {...shared} />} />
          <Route path="/transferencia" element={<TransferView {...shared} />} />
          <Route path="/historico" element={<HistoryView {...shared} />} />
          <Route path="*" element={<Navigate to="/clientes" replace />} />
        </Routes>
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-8 text-xs text-slate-400 sm:px-6">
        API: <code className="font-mono">{BASE_URL}</code>
      </footer>
    </div>
  )
}
