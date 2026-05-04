export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#050508] text-white flex flex-col">
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>
    </div>
  )
}
