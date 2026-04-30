'use client'

import LayoutAdmin from '@/app/components/LayoutAdmin'
import Protegido from '@/app/components/Protegido'
import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'

export default function Dashboard() {
  const [totalEventos, setTotalEventos] = useState(0)
  const [totalPresencas, setTotalPresencas] = useState(0)
  const [eventosAbertos, setEventosAbertos] = useState(0)
  const [presencasHoje, setPresencasHoje] = useState(0)

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    // Eventos
    const { data: eventos } = await supabase
      .from('eventos')
      .select('*')

    setTotalEventos(eventos?.length || 0)

    const abertos = eventos?.filter(e => e.status !== 'Encerrado') || []
    setEventosAbertos(abertos.length)

    // Presenças
    const { data: presencas } = await supabase
      .from('presencas')
      .select('*')

    setTotalPresencas(presencas?.length || 0)

    // Presenças hoje
    const hoje = new Date().toISOString().split('T')[0]

    const hojeFiltrado = presencas?.filter(p =>
      p.data_hora.startsWith(hoje)
    ) || []

    setPresencasHoje(hojeFiltrado.length)
  }

  return (
    <Protegido>
      <LayoutAdmin>
        <h1 style={{ marginBottom: 20 }}>Dashboard</h1>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 20
          }}
        >
          <Card titulo="Total de Eventos" valor={totalEventos} cor="#2563eb" />
          <Card titulo="Eventos Abertos" valor={eventosAbertos} cor="#16a34a" />
          <Card titulo="Total de Presenças" valor={totalPresencas} cor="#9333ea" />
          <Card titulo="Presenças Hoje" valor={presencasHoje} cor="#f59e0b" />
        </div>
      </LayoutAdmin>
    </Protegido>
  )
}

// 🔹 componente de card
function Card({ titulo, valor, cor }: any) {
  return (
    <div
      style={{
        background: 'white',
        padding: 20,
        borderRadius: 12,
        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
        borderLeft: `6px solid ${cor}`
      }}
    >
      <p style={{ color: '#64748b', marginBottom: 8 }}>{titulo}</p>
      <h2 style={{ fontSize: 28 }}>{valor}</h2>
    </div>
  )
}