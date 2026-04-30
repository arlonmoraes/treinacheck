'use client'

import LayoutAdmin from '@/app/components/LayoutAdmin'
import Protegido from '@/app/components/Protegido'
import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useParams } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'

type Evento = {
  id: string
  titulo: string
  tipo: string
  data: string
  instrutor: string
  codigo: string
}

export default function EventoDetalhe() {
  const params = useParams()
  const id = params.id as string

  const [evento, setEvento] = useState<Evento | null>(null)
  const [presencas, setPresencas] = useState<any[]>([])

  useEffect(() => {
    buscarEvento()
  }, [])

  async function buscarEvento() {
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.log(error)
      alert('Erro ao buscar evento')
      return
    }

    setEvento(data)
    buscarPresencas(data.id)
  }

  async function buscarPresencas(eventoId: string) {
    const { data, error } = await supabase
      .from('presencas')
      .select('*')
      .eq('evento_id', eventoId)
      .order('data_hora', { ascending: false })

    if (error) {
      console.log(error)
      return
    }

    setPresencas(data || [])
  }

  function exportarCSV() {
    if (!evento) return

    const linhas = [
      ['Nome', 'Matrícula', 'Setor', 'Empresa', 'Data/Hora'],
      ...presencas.map((p) => [
        p.nome,
        p.matricula,
        p.setor,
        p.empresa,
        new Date(p.data_hora).toLocaleString(),
      ]),
    ]

    const csv = linhas
      .map((linha) => linha.map((campo) => `"${campo}"`).join(';'))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `presenca-${evento.titulo}.csv`
    link.click()

    URL.revokeObjectURL(url)
  }

  if (!evento) {
    return <div style={{ padding: 20 }}>Carregando...</div>
  }

  const linkPresenca = `https://treinacheck.vercel.app/presenca/${evento.codigo}`

 return (
  <Protegido>
    <LayoutAdmin>
      <h1 style={{ marginBottom: 6 }}>{evento.titulo}</h1>

      <p style={{ color: '#64748b', marginBottom: 20 }}>
        {evento.tipo} • {evento.data} • Instrutor: {evento.instrutor}
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 20
        }}
      >
        <div
          style={{
            background: 'white',
            padding: 24,
            borderRadius: 12,
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            textAlign: 'center'
          }}
        >
          <h2>QR Code de Presença</h2>

          <div
            style={{
              background: '#f8fafc',
              padding: 20,
              borderRadius: 12,
              display: 'inline-block',
              margin: '16px 0'
            }}
          >
            <QRCodeSVG value={linkPresenca} size={260} />
          </div>

          <p style={{ fontSize: 13, color: '#64748b', wordBreak: 'break-all' }}>
            {linkPresenca}
          </p>
        </div>

        <div
          style={{
            background: 'white',
            padding: 24,
            borderRadius: 12,
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
          }}
        >
          <h2>Lista de Presença</h2>

          <p style={{ color: '#64748b' }}>
            Total de presentes: <strong>{presencas.length}</strong>
          </p>

          <button
            onClick={exportarCSV}
            style={{
              background: '#0f172a',
              color: 'white',
              border: 'none',
              padding: '10px 14px',
              borderRadius: 8,
              cursor: 'pointer',
              marginBottom: 16
            }}
          >
            Exportar CSV
          </button>

          {presencas.length === 0 && (
            <p style={{ color: '#64748b' }}>Nenhuma presença registrada ainda.</p>
          )}

          {presencas.map((p) => (
            <div
              key={p.id}
              style={{
                borderBottom: '1px solid #e5e7eb',
                padding: '10px 0'
              }}
            >
              <strong>{p.nome}</strong>
              <br />
              <span style={{ color: '#64748b' }}>
                Matrícula: {p.matricula} • Setor: {p.setor}
              </span>
              <br />
              <span style={{ fontSize: 13, color: '#64748b' }}>
                Hora: {new Date(p.data_hora).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </LayoutAdmin>
  </Protegido>
)
}