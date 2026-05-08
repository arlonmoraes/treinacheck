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
      .order('created_at', {
        ascending: false,
      })

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

    // remove presenças
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

    // remove evento
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

  const eventosFiltrados = eventos.filter(
    (e) =>
      e.titulo
        .toLowerCase()
        .includes(busca.toLowerCase())
  )

  return (
    <Protegido>
      <LayoutAdmin>
        <div className="space-y-8">
          {/* TOPO */}
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold">
                📅 Eventos
              </h1>

              <p className="text-slate-400 mt-2">
                Gerencie os treinamentos e DDS
              </p>
            </div>

            <Link href="/eventos/novo">
              <button className="bg-blue-600 hover:bg-blue-700 transition-all px-5 py-3 rounded-2xl font-semibold shadow-lg">
                + Criar novo evento
              </button>
            </Link>
          </div>

          {/* BUSCA */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <input
              placeholder="Buscar evento..."
              value={busca}
              onChange={(e) =>
                setBusca(e.target.value)
              }
              className="
                w-full
                bg-slate-800
                border
                border-slate-700
                rounded-2xl
                p-4
                outline-none
                focus:border-blue-500
                transition-all
              "
            />
          </div>

          {/* GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {eventosFiltrados.map((evento) => (
              <div
                key={evento.id}
                className="
                  bg-slate-900
                  border
                  border-slate-800
                  rounded-3xl
                  p-6
                  shadow-2xl
                  hover:scale-[1.02]
                  transition-all
                "
              >
                {/* HEADER */}
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {evento.titulo}
                    </h2>

                    <p className="text-slate-400 mt-1">
                      {evento.tipo}
                    </p>
                  </div>

                  <StatusBadge
                    status={
                      evento.status || 'Aberto'
                    }
                  />
                </div>

                {/* INFOS */}
                <div className="space-y-3 mt-6">
                  <Info
                    titulo="📅 Data"
                    valor={evento.data}
                  />

                  <Info
                    titulo="👨‍🏫 Instrutor"
                    valor={evento.instrutor}
                  />

                  <Info
                    titulo="🔐 Código"
                    valor={evento.codigo.slice(
                      0,
                      8
                    )}
                  />
                </div>

                {/* BOTÕES */}
                <div className="flex gap-3 mt-8">
                  <Link
                    href={`/eventos/${evento.id}`}
                    className="flex-1"
                  >
                    <button
                      className="
                        w-full
                        bg-blue-600
                        hover:bg-blue-700
                        transition-all
                        py-3
                        rounded-2xl
                        font-semibold
                      "
                    >
                      QR Code
                    </button>
                  </Link>

                  <button
                    onClick={() =>
                      excluirEvento(evento.id)
                    }
                    className="
                      bg-red-600
                      hover:bg-red-700
                      transition-all
                      px-5
                      rounded-2xl
                      font-semibold
                    "
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* VAZIO */}
          {eventosFiltrados.length === 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center">
              <h2 className="text-2xl font-bold">
                Nenhum evento encontrado
              </h2>

              <p className="text-slate-400 mt-3">
                Tente outra busca
              </p>
            </div>
          )}
        </div>
      </LayoutAdmin>
    </Protegido>
  )
}

/* INFO */
function Info({
  titulo,
  valor,
}: any) {
  return (
    <div className="bg-slate-800 p-4 rounded-2xl">
      <p className="text-slate-400 text-sm">
        {titulo}
      </p>

      <strong className="text-lg">
        {valor}
      </strong>
    </div>
  )
}

/* STATUS */
function StatusBadge({
  status,
}: any) {
  const encerrado =
    status === 'Encerrado'

  return (
    <div
      className={`
        px-4
        py-2
        rounded-full
        text-sm
        font-bold
        ${
          encerrado
            ? 'bg-red-500/20 text-red-400'
            : 'bg-green-500/20 text-green-400'
        }
      `}
    >
      {status}
    </div>
  )
}