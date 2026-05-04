export default function LoadingScreen({ onDone }) {
  setTimeout(() => {
    onDone()
  }, 1500)

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#050508] z-50">
      <div className="text-center">
        <h1 className="text-gold-gradient text-2xl font-semibold logo-reveal">
          Punta Rollers
        </h1>
        <p className="mt-2 text-xs tracking-widest tagline-reveal">
          CLUB EXPERIENCE
        </p>
      </div>
    </div>
  )
}
