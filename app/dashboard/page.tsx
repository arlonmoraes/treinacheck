'use client'

import LayoutAdmin from '@/app/components/LayoutAdmin'
import Protegido from '@/app/components/Protegido'
import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

export default function Dashboard() {
  const [totalEventos, setTotalEventos] =
    useState(0)

  const [totalPresencas, setTotalPresencas] =
    useState(0)

  const [eventosAbertos, setEventosAbertos] =
    useState(0)

  const [presencasHoje, setPresencasHoje] =
    useState(0)

  /* DADOS GRÁFICOS */
  const [dadosEventos, setDadosEventos] =
    useState<any[]>([])

  const [dadosPresencas, setDadosPresencas] =
    useState<any[]>([])

  /* RANKING */
  const [ranking, setRanking] =
    useState<any[]>([])

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    /* EVENTOS */
    const { data: eventos } = await supabase
      .from('eventos')
      .select('*')

    setTotalEventos(eventos?.length || 0)

    const abertos =
      eventos?.filter(
        (e) => e.status !== 'Encerrado'
      ) || []

    setEventosAbertos(abertos.length)

    /* TIPOS DE EVENTOS */

    const dds =
      eventos?.filter(
        (e) => e.tipo === 'DDS'
      ).length || 0

    const ddq =
      eventos?.filter(
        (e) => e.tipo === 'DDQ'
      ).length || 0

    const treinamentos =
      eventos?.filter(
        (e) =>
          e.tipo === 'Treinamento'
      ).length || 0

    setDadosEventos([
      {
        nome: 'DDS',
        total: dds,
      },
      {
        nome: 'DDQ',
        total: ddq,
      },
      {
        nome: 'Treinamento',
        total: treinamentos,
      },
    ])

    /* PRESENÇAS */
    const { data: presencas } =
      await supabase
        .from('presencas')
        .select('*')

    setTotalPresencas(
      presencas?.length || 0
    )

    /* PRESENÇAS HOJE */
    const hoje = new Date()
      .toISOString()
      .split('T')[0]

    const hojeFiltrado =
      presencas?.filter((p) =>
        p.data_hora.startsWith(hoje)
      ) || []

    setPresencasHoje(
      hojeFiltrado.length
    )

    /* GRÁFICO SEMANAL */

    const diasSemana = [
      'Dom',
      'Seg',
      'Ter',
      'Qua',
      'Qui',
      'Sex',
      'Sab',
    ]

    const mapa: any = {}

    diasSemana.forEach((dia) => {
      mapa[dia] = 0
    })

    presencas?.forEach((p) => {
      const data = new Date(
        p.data_hora
      )

      const dia =
        diasSemana[data.getDay()]

      mapa[dia]++
    })

    const grafico =
      diasSemana.map((dia) => ({
        dia,
        total: mapa[dia],
      }))

    setDadosPresencas(grafico)

    /* RANKING */

    const mapaRanking: any = {}

    presencas?.forEach((p) => {
      if (!mapaRanking[p.nome]) {
        mapaRanking[p.nome] = 0
      }

      mapaRanking[p.nome]++
    })

    const rankingFinal = Object.entries(
      mapaRanking
    )
      .map(([nome, total]) => ({
        nome,
        total,
      }))
      .sort(
        (a: any, b: any) =>
          b.total - a.total
      )
      .slice(0, 10)

    setRanking(rankingFinal)
  }

  return (
    <Protegido>
      <LayoutAdmin>
        <div className="space-y-8">
          {/* TOPO */}
          <div>
            <h1 className="text-4xl font-bold">
              📊 Dashboard
            </h1>

            <p className="text-slate-400 mt-2">
              Visão geral do sistema
            </p>
          </div>

          {/* CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <Card
              titulo="Total de Eventos"
              valor={totalEventos}
              cor="from-blue-500 to-blue-700"
              icone="📅"
            />

            <Card
              titulo="Eventos Abertos"
              valor={eventosAbertos}
              cor="from-green-500 to-green-700"
              icone="🟢"
            />

            <Card
              titulo="Total Presenças"
              valor={totalPresencas}
              cor="from-purple-500 to-purple-700"
              icone="👥"
            />

            <Card
              titulo="Presenças Hoje"
              valor={presencasHoje}
              cor="from-orange-500 to-orange-700"
              icone="🔥"
            />
          </div>

          {/* GRÁFICOS */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

            {/* BARRAS */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
              <h2 className="text-2xl font-bold mb-6">
                📈 Presenças na Semana
              </h2>

              <div
                style={{
                  width: '100%',
                  height: 300,
                }}
              >
                <ResponsiveContainer>
                  <BarChart
                    data={dadosPresencas}
                  >
                    <XAxis dataKey="dia" />

                    <YAxis />

                    <Tooltip />

                    <Bar
                      dataKey="total"
                      radius={[
                        8,
                        8,
                        0,
                        0,
                      ]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* PIZZA */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
              <h2 className="text-2xl font-bold mb-6">
                🥧 Tipos de Evento
              </h2>

              <div
                style={{
                  width: '100%',
                  height: 300,
                }}
              >
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={dadosEventos}
                      dataKey="total"
                      nameKey="nome"
                      outerRadius={100}
                      label
                    >
                      {dadosEventos.map(
                        (_, index) => (
                          <Cell
                            key={index}
                            fill={[
                              '#3b82f6',
                              '#22c55e',
                              '#f97316',
                            ][index]}
                          />
                        )
                      )}
                    </Pie>

                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* RANKING */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">
                🏆 Ranking de Participantes
              </h2>

              <div className="bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-2xl">
                TOP 10
              </div>
            </div>

            {ranking.length === 0 && (
              <div className="text-slate-400">
                Nenhuma presença registrada
              </div>
            )}

            <div className="space-y-4">
              {ranking.map((p, index) => (
                <div
                  key={index}
                  className="
                    bg-slate-800
                    rounded-2xl
                    p-5
                    flex
                    items-center
                    justify-between
                  "
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="
                        w-12
                        h-12
                        rounded-full
                        bg-yellow-500
                        text-black
                        font-bold
                        flex
                        items-center
                        justify-center
                      "
                    >
                      #{index + 1}
                    </div>

                    <div>
                      <h3 className="text-xl font-bold">
                        {p.nome}
                      </h3>

                      <p className="text-slate-400 text-sm">
                        Participante
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <h2 className="text-3xl font-bold">
                      {p.total}
                    </h2>

                    <p className="text-slate-400 text-sm">
                      presenças
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PAINEL */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

            {/* CARD 1 */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
              <h2 className="text-2xl font-bold mb-4">
                🚀 Sistema Ativo
              </h2>

              <p className="text-slate-400 leading-7">
                O TreinaCheck está
                operando normalmente.

                <br />
                <br />

                Sistema protegido com:
              </p>

              <div className="mt-6 space-y-3">
                <Item texto="QR Code seguro" />
                <Item texto="Bloqueio por GPS" />
                <Item texto="Selfie obrigatória" />
                <Item texto="Controle de horário" />
                <Item texto="Exportação CSV" />
                <Item texto="Exportação PDF" />
              </div>
            </div>

            {/* CARD 2 */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
              <h2 className="text-2xl font-bold mb-4">
                📈 Resumo
              </h2>

              <div className="space-y-5">
                <ResumoLinha
                  titulo="Eventos cadastrados"
                  valor={totalEventos}
                />

                <ResumoLinha
                  titulo="Participantes"
                  valor={totalPresencas}
                />

                <ResumoLinha
                  titulo="Eventos ativos"
                  valor={eventosAbertos}
                />

                <ResumoLinha
                  titulo="Check-ins hoje"
                  valor={presencasHoje}
                />
              </div>
            </div>
          </div>
        </div>
      </LayoutAdmin>
    </Protegido>
  )
}

/* CARD */
function Card({
  titulo,
  valor,
  cor,
  icone,
}: any) {
  return (
    <div
      className={`
        bg-gradient-to-br
        ${cor}
        rounded-3xl
        p-6
        shadow-2xl
        hover:scale-[1.02]
        transition-all
      `}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm">
            {titulo}
          </p>

          <h2 className="text-5xl font-bold mt-3">
            {valor}
          </h2>
        </div>

        <div className="text-5xl">
          {icone}
        </div>
      </div>
    </div>
  )
}

/* RESUMO */
function ResumoLinha({
  titulo,
  valor,
}: any) {
  return (
    <div className="flex items-center justify-between bg-slate-800 p-4 rounded-2xl">
      <span className="text-slate-300">
        {titulo}
      </span>

      <strong className="text-2xl">
        {valor}
      </strong>
    </div>
  )
}

/* ITEM */
function Item({
  texto,
}: any) {
  return (
    <div className="bg-slate-800 p-4 rounded-2xl">
      ✅ {texto}
    </div>
  )
}