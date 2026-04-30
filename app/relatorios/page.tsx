'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import Protegido from '@/app/components/Protegido'
import LayoutAdmin from '@/app/components/LayoutAdmin'

type Evento = {
  id: string
  titulo: string
  tipo: string
  data: string
}

export default function Relatorios() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [eventoId, setEventoId] = useState('')
  const [dados, setDados] = useState<any[]>([])

  useEffect(() => {
    buscarEventos()
  }, [])

  async function buscarEventos() {
    const { data, error } = await supabase
      .from('eventos')
      .select('id, titulo, tipo, data')
      .order('created_at', { ascending: false })

    if (error) {
      console.log(error)
      alert('Erro ao buscar eventos')
      return
    }

    setEventos(data || [])
  }

  async function buscar() {
    if (!eventoId) {
      alert('Selecione um evento')
      return
    }

    const { data, error } = await supabase
      .from('presencas')
      .select('*')
      .eq('evento_id', eventoId)
      .order('data_hora', { ascending: false })

    if (error) {
      console.log(error)
      alert('Erro ao buscar presenças')
      return
    }

    setDados(data || [])
  }

  function exportarCSV() {
    const linhas = [
      ['Nome', 'Matrícula', 'Setor', 'Empresa', 'Data/Hora'],
      ...dados.map((p) => [
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
    link.download = `relatorio-evento.csv`
    link.click()

    URL.revokeObjectURL(url)
  }

  return (
    <Protegido>
      <LayoutAdmin>
        <h1>Relatório por Evento</h1>

        <div style={{ background: 'white', padding: 20, borderRadius: 10, marginTop: 20 }}>
          <label>Selecione o evento</label>
          <br />

          <select
            value={eventoId}
            onChange={(e) => setEventoId(e.target.value)}
            style={{
              width: '100%',
              maxWidth: 500,
              padding: 10,
              borderRadius: 8,
              border: '1px solid #ccc',
              marginTop: 6
            }}
          >
            <option value="">Escolha...</option>

            {eventos.map((evento) => (
              <option key={evento.id} value={evento.id}>
                {evento.data} - {evento.tipo} - {evento.titulo}
              </option>
            ))}
          </select>

          <br /><br />

          <button onClick={buscar}>Buscar presenças</button>

          <br /><br />

          <button onClick={exportarCSV}>Exportar CSV</button>
        </div>

        <div style={{ background: 'white', padding: 20, borderRadius: 10, marginTop: 20 }}>
          <h2>Resultados</h2>

          <p>Total de presentes: <strong>{dados.length}</strong></p>

          {dados.length === 0 && <p>Nenhum registro encontrado.</p>}

          {dados.map((p) => (
            <div key={p.id} style={{ borderBottom: '1px solid #e5e7eb', padding: '10px 0' }}>
              <strong>{p.nome}</strong>
              <br />
              Matrícula: {p.matricula} • Setor: {p.setor}
              <br />
              Empresa: {p.empresa}
              <br />
              <span style={{ color: '#64748b' }}>
                {new Date(p.data_hora).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </LayoutAdmin>
    </Protegido>
  )
}