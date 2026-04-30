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
    <div style={{ minHeight: '100vh', background: '#eef2f7', color: '#111827' }}>
      <header
        style={{
          background: '#0f172a',
          color: 'white',
          padding: '18px 24px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.15)'
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ margin: 0 }}>TreinaCheck</h2>
          <p style={{ margin: '4px 0 14px', color: '#cbd5e1' }}>
            Sistema de presença digital
          </p>

          <nav style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link style={linkStyle} href="/">Início</Link>
            <Link style={linkStyle} href="/eventos">Eventos</Link>
            <Link style={linkStyle} href="/eventos/novo">Novo Evento</Link>
            <Link style={linkStyle} href="/relatorios">Relatórios</Link>

            <button onClick={sair} style={logoutStyle}>
              Sair
            </button>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
        {children}
      </main>
    </div>
  )
}

const linkStyle = {
  color: 'white',
  textDecoration: 'none',
  background: '#1e293b',
  padding: '8px 12px',
  borderRadius: 8
}

const logoutStyle = {
  background: '#dc2626',
  color: 'white',
  border: 'none',
  padding: '8px 12px',
  borderRadius: 8,
  cursor: 'pointer'
}