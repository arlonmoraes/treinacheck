'use client'

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
    <div style={{ padding: 20 }}>
      <h1>{evento.titulo}</h1>

      <p>Tipo: {evento.tipo}</p>
      <p>Data: {evento.data}</p>
      <p>Instrutor: {evento.instrutor}</p>

      <h2>QR Code de Presença</h2>

      <QRCodeSVG value={linkPresenca} size={240} />

      <p>{linkPresenca}</p>

      <hr />

      <h2>Lista de Presença</h2>

	<button onClick={exportarCSV}>
 	 Exportar CSV
	</button>

	<br /><br />

      {presencas.length === 0 && <p>Nenhuma presença registrada ainda</p>}

      {presencas.map((p) => (
        <div key={p.id} style={{ borderBottom: '1px solid #ccc', padding: 8 }}>
          <strong>{p.nome}</strong>
          <br />
          Matrícula: {p.matricula}
          <br />
          Setor: {p.setor}
          <br />
          Hora: {new Date(p.data_hora).toLocaleTimeString()}
        </div>
      ))}
    </div>
  </Protegido>
  )
}