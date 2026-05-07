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
  status?: string
}

export default function Eventos() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [busca, setBusca] = useState('')

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

  async function excluirEvento(id: string) {
    const confirmar = confirm(
      'Deseja realmente excluir este evento?'
    )

    if (!confirmar) return

    // 🔥 remove presenças primeiro
    const { error: erroPresencas } =
      await supabase
        .from('presencas')
        .delete()
        .eq('evento_id', id)

    if (erroPresencas) {
      console.log(erroPresencas)
      alert('Erro ao excluir presenças')
      return
    }

    // 🔥 remove evento
    const { error } = await supabase
      .from('eventos')
      .delete()
      .eq('id', id)

    if (error) {
      console.log(error)
      alert('Erro ao excluir evento')
      return
    }

    alert('Evento excluído com sucesso!')

    buscarEventos()
  }

  const eventosFiltrados = eventos.filter((e) =>
    e.titulo
      .toLowerCase()
      .includes(busca.toLowerCase())
  )

  return (
    <Protegido>
      <LayoutAdmin>
        <h1 style={{ marginBottom: 20 }}>
          Eventos
        </h1>

        <input
          placeholder="Buscar evento..."
          value={busca}
          onChange={(e) =>
            setBusca(e.target.value)
          }
          style={{
            width: '100%',
            maxWidth: 400,
            padding: 10,
            borderRadius: 8,
            border: '1px solid #ccc',
            marginBottom: 20,
          }}
        />

        <div style={{ marginBottom: 20 }}>
          <Link href="/eventos/novo">
            <button
              style={{
                background: '#0f172a',
                color: 'white',
                padding: '10px 16px',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              + Criar novo evento
            </button>
          </Link>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {eventosFiltrados.map((evento) => (
            <div
              key={evento.id}
              style={{
                background: 'white',
                padding: 16,
                borderRadius: 10,
                boxShadow:
                  '0 4px 12px rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h2
                  style={{ marginBottom: 8 }}
                >
                  {evento.titulo}
                </h2>

                <p
                  style={{
                    margin: 0,
                    color: '#555',
                  }}
                >
                  Tipo: {evento.tipo}
                </p>

                <p
                  style={{
                    margin: 0,
                    color: '#555',
                  }}
                >
                  Data: {evento.data}
                </p>

                <p
                  style={{
                    margin: 0,
                    color: '#555',
                  }}
                >
                  Instrutor:{' '}
                  {evento.instrutor}
                </p>

                <p
                  style={{
                    marginTop: 8,
                  }}
                >
                  Status:{' '}
                  <strong>
                    {evento.status ||
                      'Aberto'}
                  </strong>
                </p>
              </div>

              {/* BOTÕES */}
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  marginTop: 12,
                }}
              >
                <Link
                  href={`/eventos/${evento.id}`}
                  style={{ flex: 1 }}
                >
                  <button
                    style={{
                      width: '100%',
                      background: '#2563eb',
                      color: 'white',
                      border: 'none',
                      padding: '8px',
                      borderRadius: 6,
                      cursor: 'pointer',
                    }}
                  >
                    Ver QR Code
                  </button>
                </Link>

                <button
                  onClick={() =>
                    excluirEvento(evento.id)
                  }
                  style={{
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      </LayoutAdmin>
    </Protegido>
  )
}