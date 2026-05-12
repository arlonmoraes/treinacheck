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
}

export default function Relatorios() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    buscarEventos()
  }, [])

  async function buscarEventos() {
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .order('data', { ascending: false })

    if (error) {
      console.log(error)
      alert('Erro ao buscar eventos')
      return
    }

    setEventos(data || [])
    setLoading(false)
  }

  return (
    <Protegido>
      <LayoutAdmin>
        <div className="space-y-8">
          {/* HEADER */}
          <div>
            <h1 className="text-4xl font-bold">
              📄 Relatórios
            </h1>

            <p className="text-slate-400 mt-2">
              Visualize e exporte relatórios dos eventos
            </p>
          </div>

          {/* CARD */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-auto">
            {loading ? (
              <div className="text-slate-400">
                Carregando...
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400">
                    <th className="p-4">
                      Evento
                    </th>

                    <th className="p-4">
                      Tipo
                    </th>

                    <th className="p-4">
                      Data
                    </th>

                    <th className="p-4">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {eventos.map((evento) => (
                    <tr
                      key={evento.id}
                      className="border-b border-slate-800 hover:bg-slate-800 transition-all"
                    >
                      <td className="p-4 font-medium">
                        {evento.titulo}
                      </td>

                      <td className="p-4">
                        {evento.tipo}
                      </td>

                      <td className="p-4">
                        {evento.data}
                      </td>

                      <td className="p-4">
                        <Link
                          href={`/eventos/${evento.id}`}
                        >
                          <button
                            className="
                              bg-green-600
                              hover:bg-green-700
                              px-4
                              py-2
                              rounded-xl
                              font-semibold
                              transition-all
                            "
                          >
                            📥 Baixar Relatório
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </LayoutAdmin>
    </Protegido>
  )
}