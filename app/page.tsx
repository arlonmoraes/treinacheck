import Link from 'next/link'
import Protegido from '@/app/components/Protegido'

export default function Home() {
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
      </div>
    </Protegido>
  )
}