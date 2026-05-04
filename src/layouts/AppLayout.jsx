import Header from '../components/Header'
import BottomNav from '../components/BottomNav'
import MessagePopup from '../components/MessagePopup'
import { mensajesGlobales } from '../data/mockData'

export default function AppLayout({ children }) {
  const mensaje = mensajesGlobales.find(m => m.visible)

  return (
    <div className="min-h-screen bg-[#050508] text-white flex flex-col">

      <Header />

      <main className="flex-1 px-4 pt-4 pb-24">
        {children}
      </main>

      <BottomNav />

      <MessagePopup mensaje={mensaje} />

    </div>
  )
}
