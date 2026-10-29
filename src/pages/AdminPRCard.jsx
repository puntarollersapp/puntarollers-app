import { useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import PRCardRequestsAdmin from '../components/prcard/PRCardRequestsAdmin'
import PRCardBenefitsAdmin from '../components/prcard/PRCardBenefitsAdmin'
import PRCardMembershipAudit from '../components/prcard/PRCardMembershipAudit'

export default function AdminPRCard() {
  const [section,setSection] = useState('requests')
  return <AppLayout title="Administración PR Card" showBack>
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-6">
      <div className="flex gap-2" role="tablist" aria-label="Administración PR Card"><button role="tab" aria-selected={section === 'requests'} type="button" onClick={()=>setSection('requests')} className={section === 'requests' ? 'rounded-xl bg-yellow-300 px-4 py-3 text-sm font-semibold text-black' : 'rounded-xl border border-white/20 px-4 py-3 text-sm text-white'}>Solicitudes</button><button role="tab" aria-selected={section === 'benefits'} type="button" onClick={()=>setSection('benefits')} className={section === 'benefits' ? 'rounded-xl bg-yellow-300 px-4 py-3 text-sm font-semibold text-black' : 'rounded-xl border border-white/20 px-4 py-3 text-sm text-white'}>Comercios</button><button role="tab" aria-selected={section === 'audit'} type="button" onClick={()=>setSection('audit')} className={section === 'audit' ? 'rounded-xl bg-yellow-300 px-4 py-3 text-sm font-semibold text-black' : 'rounded-xl border border-white/20 px-4 py-3 text-sm text-white'}>Membresías</button></div>
      {section === 'requests' ? <PRCardRequestsAdmin /> : section === 'benefits' ? <PRCardBenefitsAdmin /> : <PRCardMembershipAudit />}
    </div>
  </AppLayout>
}
