import PublicLayout from "../layouts/PublicLayout"

export default function Login() {
  return (
    <PublicLayout>
      <div className="px-4 py-10 max-w-md mx-auto space-y-6">

        <h1 className="text-2xl text-white text-center font-bold">
          Ingresar
        </h1>

        <div className="space-y-4">

          <input
            type="text"
            placeholder="Usuario"
            className="input-pr"
          />

          <input
            type="password"
            placeholder="PIN"
            className="input-pr"
          />

        </div>

        <button className="btn-gold w-full">
          Entrar
        </button>

      </div>
    </PublicLayout>
  )
}
