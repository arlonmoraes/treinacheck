'use client'

import Protegido from '@/app/components/Protegido'
import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import Link from 'next/link'

type Evento = {
  id: string
  titulo: string
  tipo: string
  data: string
  instrutor: string
  codigo: string
}

export default function Eventos() {
  const [eventos, setEventos] = useState<Evento[]>([])

  useEffect(() => {
    buscarEventos()
  }, [])

  async function buscarEventos() {
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.log(error)
      alert('Erro ao buscar eventos')
      return
    }

    setEventos(data || [])
  }

  return (
  <Protegido>
    <div style={{ padding: 20 }}>
      <h1>Eventos</h1>

      <Link href="/eventos/novo">
        <button>Criar novo evento</button>
      </Link>

      <br /><br />

      {eventos.map((evento) => (
        <div key={evento.id} style={{ border: '1px solid #ccc', padding: 12, marginBottom: 12 }}>
          <h2>{evento.titulo}</h2>
          <p>Tipo: {evento.tipo}</p>
          <p>Data: {evento.data}</p>
          <p>Instrutor: {evento.instrutor}</p>

          <Link href={`/eventos/${evento.id}`}>
            <button>Ver QR Code</button>
          </Link>
        </div>
      ))}
    </div>
  </Protegido>
)