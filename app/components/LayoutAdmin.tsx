'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'
import { useState, useEffect } from 'react'

export default function LayoutAdmin({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  
  const [menuAberto, setMenuAberto] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false) // 🛡️ Controle de acesso visual

  useEffect(() => {
    async function verificarPerfil() {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: perfil } = await supabase
          .from('perfis')
          .select('role')
          .eq('id', user.id)
          .single()

        if (perfil?.role === 'admin') {
          setIsAdmin(true)
        }
      }
    }
    
    verificarPerfil()
  }, [])

  async function sair() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function fecharMenu() {
    setMenuAberto(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col md:flex-row">
      
      {/* HEADER MOBILE */}
      <div className="md:hidden flex items-center justify-between bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Logo"
            className="w-10 h-10 rounded-lg bg-white p-1"
          />
          <h1 className="text-xl font-bold">Minha Lista</h1>
        </div>

        <button 
          onClick={() => setMenuAberto(!menuAberto)}
          className="p-2 bg-slate-800 rounded-lg text-white hover:bg-slate-700 transition-all text-xl"
        >
          {menuAberto ? '✖' : '☰'}
        </button>
      </div>

      {/* OVERLAY ESCURO NO CELULAR */}
      {menuAberto && (
        <div 
          className="fixed inset-0 bg-black/70 z-40 md:hidden"
          onClick={fecharMenu}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 p-6 flex flex-col
        transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${menuAberto ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* LOGO */}
        <div className="hidden md:flex items-center gap-3 mb-10">
          <img
            src="/logo.png"
            alt="Logo"
            className="w-14 h-14 rounded-xl bg-white p-1"
          />
          <div>
            <h1 className="text-2xl font-bold">Minha Lista</h1>
            <p className="text-slate-400 text-sm">Presença Digital</p>
          </div>
        </div>

        {/* MENU */}
        <nav className="flex flex-col gap-3 mt-4 md:mt-0">
          <Link href="/" className={menuItem} onClick={fecharMenu}>
            🏠 Início
          </Link>
          <Link href="/dashboard" className={menuItem} onClick={fecharMenu}>
            📊 Dashboard
          </Link>
          <Link href="/eventos" className={menuItem} onClick={fecharMenu}>
            📅 Eventos
          </Link>
          
          {/* 🛑 ITENS EXCLUSIVOS PARA ADMINISTRADORES */}
          {isAdmin && (
            <>
              <Link href="/eventos/novo" className={menuItem} onClick={fecharMenu}>
                ➕ Novo Evento
              </Link>
              <Link href="/crachas" className={menuItem} onClick={fecharMenu}>
                🪪 Gerar Crachás
              </Link>
            </>
          )}

          <Link href="/relatorios" className={menuItem} onClick={fecharMenu}>
            📄 Relatórios
          </Link>
        </nav>

        {/* BOTÃO SAIR */}
        <button
          onClick={sair}
          className="mt-auto bg-red-600 hover:bg-red-700 transition-all p-3 rounded-xl font-semibold w-full"
        >
          🚪 Sair
        </button>
      </aside>

      {/* CONTEÚDO */}
      <main className="flex-1 p-4 md:p-8 w-full overflow-x-hidden">
        {children}
      </main>
      
    </div>
  )
}

const menuItem =
  'bg-slate-800 hover:bg-slate-700 transition-all p-4 rounded-xl text-slate-200 hover:text-white font-medium'