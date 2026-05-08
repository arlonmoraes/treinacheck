'use client'

import LayoutAdmin from '@/app/components/LayoutAdmin'
import Protegido from '@/app/components/Protegido'
import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'

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
      return
    }

    setEventos(data || [])
    setLoading(false)
  }

  return (
    <Protegido>
      <LayoutAdmin>
        <div className="space-y-6">
          {/* TOPO */}
          <div>
            <h1 className="text-3xl font-bold">
              📄 Relatórios
            </h1>

            <p className="text-slate-400 mt-1">
              Visualize todos os eventos cadastrados
            </p>
          </div>

          {/* CARD */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            {loading ? (
              <p className="text-slate-400">
                Carregando...
              </p>
            ) : eventos.length === 0 ? (
              <p className="text-slate-400">
                Nenhum evento encontrado
              </p>
            ) : (
              <div className="overflow-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-left">
                      <th className="p-4">
                        Evento
                      </th>

                      <th className="p-4">
                        Tipo
                      </th>

                      <th className="p-4">
                        Data
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

                        <td className="p-4 text-slate-300">
                          {evento.tipo}
                        </td>

                        <td className="p-4 text-slate-300">
                          {evento.data}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </LayoutAdmin>
    </Protegido>
  )
}