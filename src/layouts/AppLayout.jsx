import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'
import MessagePopup from '../components/MessagePopup'
import InstallPrompt from '../components/InstallPrompt'

export default function AppLayout({
  children,
  title,
  showBack = false,
}) {
  const navigate = useNavigate()

  return (
    <div className="app-shell pb-24">
      <Header
        title={title}
        showBack={showBack}
        onBack={() => navigate(-1)}
      />

      <main>{children}</main>

      <BottomNav />
      <MessagePopup />
      <InstallPrompt />
    </div>
  )
}
