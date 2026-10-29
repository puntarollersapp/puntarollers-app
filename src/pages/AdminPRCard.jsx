import AppLayout from '../layouts/AppLayout'
import PRCardRequestsAdmin from '../components/prcard/PRCardRequestsAdmin'

export default function AdminPRCard() {
  return <AppLayout title="Solicitudes PR Card" showBack>
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-6">
      <PRCardRequestsAdmin />
    </div>
  </AppLayout>
}
