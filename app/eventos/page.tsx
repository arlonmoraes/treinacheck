'use client'

import LayoutAdmin from '@/app/components/LayoutAdmin'
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
    <LayoutAdmin>
      <h1 style={{ marginBottom: 20 }}>Eventos</h1>

      <div style={{ marginBottom: 20 }}>
        <Link href="/eventos/novo">
          <button
            style={{
              background: '#0f172a',
              color: 'white',
              padding: '10px 16px',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer'
            }}
          >
            + Criar novo evento
          </button>
        </Link>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16
        }}
      >
        {eventos.map((evento) => (
          <div
            key={evento.id}
            style={{
              background: 'white',
              padding: 16,
              borderRadius: 10,
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <h2 style={{ marginBottom: 8 }}>{evento.titulo}</h2>

              <p style={{ margin: 0, color: '#555' }}>
                Tipo: {evento.tipo}
              </p>

              <p style={{ margin: 0, color: '#555' }}>
                Data: {evento.data}
              </p>

              <p style={{ margin: 0, color: '#555' }}>
                Instrutor: {evento.instrutor}
              </p>
            </div>

            <Link href={`/eventos/${evento.id}`}>
              <button
                style={{
                  marginTop: 12,
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  padding: '8px',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
              >
                Ver QR Code
              </button>
            </Link>
          </div>
        ))}
      </div>
    </LayoutAdmin>
  </Protegido>
)
}