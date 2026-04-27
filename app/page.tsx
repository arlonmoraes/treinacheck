'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'
import Protegido from '@/app/components/Protegido'

export default function Home() {
  const router = useRouter()

  async function sair() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <Protegido>
      <div style={{ padding: 20 }}>
        <h1>TreinaCheck</h1>
        <p>Sistema de presença digital para DDS, DDQ e treinamentos.</p>

        <br />

        <Link href="/eventos/novo">
          <button>Criar novo evento</button>
        </Link>

        <br /><br />

        <Link href="/eventos">
          <button>Ver eventos</button>
        </Link>

        <br /><br />

        <Link href="/relatorios">
          <button>Relatórios</button>
        </Link>

        <br /><br />

        <button onClick={sair}>Sair</button>
      </div>
    </Protegido>
  )
}