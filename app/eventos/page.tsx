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
  codigo_evento?: string
  status?: string
  hora_fim?: string // Adicionado para podermos pegar o horário
}

export default function Eventos() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [busca, setBusca] = useState('')

  /* FILTROS */
  const [filtros, setFiltros] = useState<string[]>([])

  /* TIPOS */
  const tiposEvento = [
    'DDS',
    'DDQ',
    'Treinamento',
    'Reunião',
    'Integração',
    'Gestão de mudança',
  ]

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

  /* TOGGLE FILTRO */
  function toggleFiltro(tipo: string) {
    setFiltros((atual) => {
      if (atual.includes(tipo)) {
        return atual.filter((item) => item !== tipo)
      }
      return [...atual, tipo]
    })
  }

  async function excluirEvento(id: string) {
    const confirmar = confirm('Deseja realmente excluir este evento?')

    if (!confirmar) return

    /* REMOVE PRESENÇAS */
    const { error: erroPresencas } = await supabase
      .from('presencas')
      .delete()
      .eq('evento_id', id)

    if (erroPresencas) {
      console.log(erroPresencas)
      alert('Erro ao excluir presenças')
      return
    }

    /* REMOVE EVENTO */
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

  /* FILTRO */
  const eventosFiltrados = eventos.filter((e) => {
    const texto = busca.toLowerCase()

    const passouBusca =
      e.titulo.toLowerCase().includes(texto) ||
      e.tipo.toLowerCase().includes(texto) ||
      (e.codigo_evento || '').toLowerCase().includes(texto)

    const passouFiltro = filtros.length === 0 || filtros.includes(e.tipo)

    return passouBusca && passouFiltro
  })

  return (
    <Protegido>
      <LayoutAdmin>
        <div className="space-y-8">
          {/* TOPO */}
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold">📅 Eventos</h1>
              <p className="text-slate-400 mt-2">Gerencie os eventos</p>
            </div>

            <Link href="/eventos/novo">
              <button
                className="
                  bg-blue-600
                  hover:bg-blue-700
                  transition-all
                  px-5
                  py-3
                  rounded-2xl
                  font-semibold
                  shadow-lg
                "
              >
                + Criar novo evento
              </button>
            </Link>
          </div>

          {/* BUSCA */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <input
              placeholder="Buscar evento..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
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

          {/* FILTROS */}
          <div className="flex flex-wrap gap-3">
            {tiposEvento.map((tipo) => {
              const ativo = filtros.includes(tipo)

              return (
                <button
                  key={tipo}
                  onClick={() => toggleFiltro(tipo)}
                  className={`
                    px-4
                    py-2
                    rounded-2xl
                    font-semibold
                    transition-all
                    ${
                      ativo
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }
                  `}
                >
                  {tipo}
                </button>
              )
            })}
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
                    <h2 className="text-2xl font-bold">{evento.titulo}</h2>
                    <p className="text-slate-400 mt-1">{evento.tipo}</p>
                  </div>

                  {/* Passamos o evento inteiro para o StatusBadge poder ler a hora */}
                  <StatusBadge evento={evento} />
                </div>

                {/* INFOS */}
                <div className="space-y-3 mt-6">
                  <Info
                    titulo="🔖 Código Evento"
                    valor={evento.codigo_evento || 'Sem código'}
                  />

                  <Info titulo="📅 Data" valor={evento.data} />

                  <Info titulo="👨‍🏫 Responsável" valor={evento.instrutor} />
                </div>

                {/* BOTÕES */}
                <div className="flex gap-3 mt-8">
                  <Link href={`/eventos/${evento.id}`} className="flex-1">
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
                      Abrir
                    </button>
                  </Link>

                  <button
                    onClick={() => excluirEvento(evento.id)}
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
              <h2 className="text-2xl font-bold">Nenhum evento encontrado</h2>
              <p className="text-slate-400 mt-3">Tente outra busca</p>
            </div>
          )}
        </div>
      </LayoutAdmin>
    </Protegido>
  )
}

/* INFO */
function Info({ titulo, valor }: any) {
  return (
    <div className="bg-slate-800 p-4 rounded-2xl">
      <p className="text-slate-400 text-sm">{titulo}</p>
      <strong className="text-lg">{valor}</strong>
    </div>
  )
}

/* STATUS ATUALIZADO COM VERIFICAÇÃO DE HORA */
function StatusBadge({ evento }: any) {
  // Define o status padrão como o que vem do banco
  let statusAtual = evento.status || 'Aberto'

  // Verifica se não foi encerrado manualmente e valida a hora
  if (statusAtual !== 'Encerrado' && evento.data && evento.hora_fim) {
    const agora = new Date()
    const dataHoraFim = new Date(`${evento.data}T${evento.hora_fim}`)

    // Se o momento atual for maior que a data e hora do fim do evento, força como Encerrado
    if (agora > dataHoraFim) {
      statusAtual = 'Encerrado'
    }
  }

  const isEncerrado = statusAtual === 'Encerrado'

  return (
    <div
      className={`
        px-4
        py-2
        rounded-full
        text-sm
        font-bold
        ${
          isEncerrado
            ? 'bg-red-500/20 text-red-400'
            : 'bg-green-500/20 text-green-400'
        }
      `}
    >
      {statusAtual}
    </div>
  )
}