import { lazy, Suspense } from 'react'
import AppLayout from '../layouts/AppLayout'
import Header from '../components/Header'
const Experience = lazy(() => import('../components/rollermap/NativeRollerMap'))
export default function RollerMap({ admin = false, publicView = false }) {
  const content = <Suspense fallback={<div className="min-h-[50vh] grid place-items-center"><img src="/rollermap/logo.png" alt="Cargando RollerMap" className="w-44" /></div>}><Experience admin={admin} publicView={publicView} /></Suspense>
  if (publicView) return <div className="app-shell"><Header title="RollerMap" showBack />{content}</div>
  return <AppLayout title={admin ? 'Administrar RollerMap' : 'RollerMap'} showBack>{content}</AppLayout>
}
