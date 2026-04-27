'use client'

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
  }

  if (!evento) {
    return <div style={{ padding: 20 }}>Carregando...</div>
  }

  const linkPresenca = `http://192.168.151.2:3000/presenca/${evento.codigo}`

  return (
    <div style={{ padding: 20 }}>
      <h1>{evento.titulo}</h1>

      <p>Tipo: {evento.tipo}</p>
      <p>Data: {evento.data}</p>
      <p>Instrutor: {evento.instrutor}</p>

      <h2>QR Code de Presença</h2>

      <QRCodeSVG value={linkPresenca} size={240} />

      <p>{linkPresenca}</p>
    </div>
  )
}