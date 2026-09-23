import AppLayout from '../layouts/AppLayout'

export default function PRPerformance() {
  return (
    <AppLayout>
      <main className="min-h-screen bg-[#050508] px-4 pb-24 pt-5 text-white">
        <div className="mx-auto max-w-6xl">
          <section className="rounded-[34px] border border-orange-300/20 bg-[#0b0c10] p-6">
            <p className="text-[10px] font-black uppercase tracking-[.24em] text-orange-300">
              PR PERFORMANCE · CENTRO DE RENDIMIENTO
            </p>
            <h1 className="mt-2 text-4xl font-black">Expediente deportivo PR.</h1>
            <p className="mt-3 text-sm text-white/45">
              Módulo de rendimiento deportivo Punta Rollers.
            </p>
          </section>
        </div>
      </main>
    </AppLayout>
  )
}
