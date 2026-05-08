'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'

export default function LayoutAdmin({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  async function sair() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      {/* SIDEBAR */}
      <aside className="w-72 bg-slate-900 border-r border-slate-800 p-6 flex flex-col">
        {/* LOGO */}
        <div className="flex items-center gap-3 mb-10">
          <img
            src="/logo.png"
            alt="Logo"
            className="w-14 h-14 rounded-xl bg-white p-1"
          />

          <div>
            <h1 className="text-2xl font-bold">
              TreinaCheck
            </h1>

            <p className="text-slate-400 text-sm">
              Presença Digital
            </p>
          </div>
        </div>

        {/* MENU */}
        <nav className="flex flex-col gap-3">
          <Link
            href="/"
            className={menuItem}
          >
            🏠 Início
          </Link>

          <Link
            href="/dashboard"
            className={menuItem}
          >
            📊 Dashboard
          </Link>

          <Link
            href="/eventos"
            className={menuItem}
          >
            📅 Eventos
          </Link>

          <Link
            href="/eventos/novo"
            className={menuItem}
          >
            ➕ Novo Evento
          </Link>

          <Link
            href="/relatorios"
            className={menuItem}
          >
            📄 Relatórios
          </Link>
        </nav>

        {/* BOTÃO SAIR */}
        <button
          onClick={sair}
          className="mt-auto bg-red-600 hover:bg-red-700 transition-all p-3 rounded-xl font-semibold"
        >
          🚪 Sair
        </button>
      </aside>

      {/* CONTEÚDO */}
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  )
}

const menuItem =
  'bg-slate-800 hover:bg-slate-700 transition-all p-4 rounded-xl text-slate-200 hover:text-white font-medium'