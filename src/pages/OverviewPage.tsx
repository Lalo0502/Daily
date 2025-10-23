import { useAuth } from "@/app/AuthProvider"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export default function OverviewPage() {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center text-slate-900">
      <div className="max-w-lg w-full px-6 text-center">
        <h1 className="text-3xl font-semibold mb-4">👋 Bienvenido</h1>
        <p className="text-slate-600 mb-8">
          Estás en el <strong>Dashboard</strong> de prueba.<br />
          Aquí es donde verías tus tickets, estadísticas, o cualquier módulo interno.
        </p>

        {user && (
          <div className="mb-6 text-sm text-slate-500">
            Sesión iniciada como: <span className="font-medium">{user.email}</span>
          </div>
        )}

        <Button
          onClick={async () => await signOut()}
          className="inline-flex items-center gap-2 bg-slate-900 text-white hover:bg-black transition-all rounded-lg h-11 px-6"
        >
          <LogOut className="h-5 w-5" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  )
}
