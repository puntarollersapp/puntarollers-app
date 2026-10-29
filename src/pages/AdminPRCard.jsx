import AppLayout from '../layouts/AppLayout'
import PRCardRequestsAdmin from '../components/prcard/PRCardRequestsAdmin'
import PRCardBenefitsAdmin from '../components/prcard/PRCardBenefitsAdmin'

export default function AdminPRCard() {
  return <AppLayout title="Solicitudes PR Card" showBack>
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-6">
      <PRCardRequestsAdmin />
      <PRCardBenefitsAdmin />
    </div>
  </AppLayout>
}
