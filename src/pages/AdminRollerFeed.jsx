import AppLayout from '../layouts/AppLayout'
import RollerFeedNewsAdmin from '../components/admin/RollerFeedNewsAdmin'

export default function AdminRollerFeed() {
  return <AppLayout title="RollerFeed · Administración">
    <main className="mx-auto max-w-4xl space-y-4 px-4 py-6">
      <RollerFeedNewsAdmin />
    </main>
  </AppLayout>
}
