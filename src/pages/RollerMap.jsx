import { lazy, Suspense } from 'react'
import AppLayout from '../layouts/AppLayout'
import { Link } from 'react-router-dom'
const Experience = lazy(() => import('../components/rollermap/NativeRollerMap'))
export default function RollerMap({ admin = false, publicView = false }) {
  const content = <Suspense fallback={<div className="min-h-[50vh] grid place-items-center"><img src="/rollermap/logo.png" alt="Cargando RollerMap" className="w-44" /></div>}><Experience admin={admin} publicView={publicView} /></Suspense>
  if (publicView) return <div className="app-shell"><header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4"><Link to="/" className="flex items-center gap-2 text-sm font-black text-white"><img src="/logo.png" alt="Punta Rollers" className="h-9 w-9 object-contain"/>Punta Rollers</Link><Link to="/login" className="rounded-full border border-cyan-300/25 px-4 py-2 text-xs font-bold text-cyan-200">Ingresar a mi PR</Link></header>{content}</div>
  return <AppLayout title={admin ? 'Administrar RollerMap' : 'RollerMap'} showBack>{content}</AppLayout>
}
