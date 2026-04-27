'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'

export default function LayoutAdmin({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  async function sair() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6f8' }}>
      <header style={{ background: '#111827', color: 'white', padding: 16 }}>
        <h2>TreinaCheck</h2>

        <nav style={{ display: 'flex', gap: 12, marginTop: 10 }}>
          <Link href="/">Início</Link>
          <Link href="/eventos">Eventos</Link>
          <Link href="/eventos/novo">Novo Evento</Link>
          <Link href="/relatorios">Relatórios</Link>
          <button onClick={sair}>Sair</button>
        </nav>
      </header>

      <main style={{ padding: 20 }}>
        {children}
      </main>
    </div>
  )
}