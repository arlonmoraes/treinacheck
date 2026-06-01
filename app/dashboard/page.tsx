Perfeito! Para o **Dashboard**, a lógica é exatamente a que conversamos, mas com um detalhe extra muito importante: como o Dashboard também mostra as **presenças**, nós precisamos primeiro buscar os eventos do usuário e, depois, buscar **apenas as presenças que pertencem a esses eventos**.

Fiz essas alterações na sua função `carregarDados`.

Pode substituir todo o seu arquivo `Dashboard.tsx` (geralmente em `src/app/dashboard/page.tsx` ou similar) por este aqui:

```tsx
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
  const [totalEventos, setTotalEventos] = useState(0)
  const [totalPresencas, setTotalPresencas] = useState(0)
  const [eventosAbertos, setEventosAbertos] = useState(0)
  const [presencasHoje, setPresencasHoje] = useState(0)

  /* DADOS GRÁFICOS */
  const [dadosEventos, setDadosEventos] = useState<any[]>([])
  const [dadosPresencas, setDadosPresencas] = useState<any[]>([])

  /* RANKING */
  const [ranking, setRanking] = useState<any[]>([])

  /* AO VIVO */
  const [ultimasPresencas, setUltimasPresencas] = useState<any[]>([])

  useEffect(() => {
    carregarDados()

    /* REALTIME */
    const canal = supabase
      .channel('presencas-tempo-real')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'presencas',
        },
        () => {
          carregarDados()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [])

  async function carregarDados() {
    // 1. DESCOBRE QUEM ESTÁ LOGADO
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    /* 2. EVENTOS (Filtrando pelo usuário logado) */
    const { data: eventos } = await supabase
      .from('eventos')
      .select('*')
      .eq('usuario_id', user.id) // <-- O FILTRO DE PRIVACIDADE AQUI

    setTotalEventos(eventos?.length || 0)

    // Aproveitando para corrigir a lógica de abertos que fizemos antes
    const abertos =
      eventos?.filter((e) => {
        if (e.status === 'Encerrado') return false
        
        const agora = new Date()
        const fim = new Date(`${e.data}T${e.hora_fim}`)
        
        return agora <= fim
      }) || []

    setEventosAbertos(abertos.length)

    /* TIPOS EVENTOS */
    const dds = eventos?.filter((e) => e.tipo === 'DDS').length || 0
    const ddq = eventos?.filter((e) => e.tipo === 'DDQ').length || 0
    const treinamentos =
      eventos?.filter((e) => e.tipo === 'Treinamento').length || 0

    setDadosEventos([
      { nome: 'DDS', total: dds },
      { nome: 'DDQ', total: ddq },
      { nome: 'Treinamento', total: treinamentos },
    ])

    // Pega todos os IDs dos eventos deste usuário para buscar só as presenças dele
    const idsEventosDoUsuario = eventos?.map((e) => e.id) || []

    let presencas: any[] = []

    /* 3. PRESENÇAS (Apenas dos eventos deste usuário) */
    if (idsEventosDoUsuario.length > 0) {
      const { data: presencasEncontradas } = await supabase
        .from('presencas')
        .select('*')
        .in('evento_id', idsEventosDoUsuario) // <-- FILTRO DE PRIVACIDADE NAS PRESENÇAS
        .order('data_hora', { ascending: false })

      presencas = presencasEncontradas || []
    }

    setTotalPresencas(presencas.length)

    /* ÚLTIMAS PRESENÇAS */
    setUltimasPresencas(presencas.slice(0, 8))

    /* PRESENÇAS HOJE */
    const hoje = new Date().toISOString().split('T')[0]
    const hojeFiltrado = presencas.filter((p) => p.data_hora.startsWith(hoje))

    setPresencasHoje(hojeFiltrado.length)

    /* GRÁFICO SEMANAL */
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
    const mapa: any = {}

    diasSemana.forEach((dia) => {
      mapa[dia] = 0
    })

    presencas.forEach((p) => {
      const data = new Date(p.data_hora)
      const dia = diasSemana[data.getDay()]
      mapa[dia]++
    })

    const grafico = diasSemana.map((dia) => ({
      dia,
      total: mapa[dia],
    }))

    setDadosPresencas(grafico)

    /* RANKING */
    const mapaRanking: any = {}

    presencas.forEach((p) => {
      if (!mapaRanking[p.nome]) {
        mapaRanking[p.nome] = 0
      }
      mapaRanking[p.nome]++
    })

    const rankingFinal = Object.entries(mapaRanking)
      .map(([nome, total]) => ({ nome, total }))
      .sort((a: any, b: any) => (b.total as number) - (a.total as number))
      .slice(0, 10)

    setRanking(rankingFinal)
  }

  return (
    <Protegido>
      <LayoutAdmin>
        <div className="space-y-8">
          {/* TOPO */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold">📊 Dashboard</h1>
              <p className="text-slate-400 mt-2">Painel em tempo real</p>
            </div>

            <div className="flex items-center gap-3 bg-green-500/20 text-green-400 px-5 py-3 rounded-2xl">
              <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
              AO VIVO
            </div>
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

          {/* AO VIVO */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">⚡ Entradas Ao Vivo</h2>

              <div className="bg-red-500/20 text-red-400 px-4 py-2 rounded-2xl">
                TEMPO REAL
              </div>
            </div>

            {ultimasPresencas.length === 0 && (
              <div className="text-slate-400">
                Nenhuma presença registrada
              </div>
            )}

            <div className="space-y-4">
              {ultimasPresencas.map((p, index) => (
                <div
                  key={index}
                  className="
                    bg-slate-800
                    rounded-2xl
                    p-5
                    flex
                    items-center
                    justify-between
                    animate-pulse
                  "
                >
                  <div className="flex items-center gap-4">
                    {p.foto_url ? (
                      <img
                        src={p.foto_url}
                        alt="selfie"
                        className="
                          w-14
                          h-14
                          rounded-full
                          object-cover
                        "
                      />
                    ) : (
                      <div
                        className="
                          w-14
                          h-14
                          rounded-full
                          bg-slate-700
                          flex
                          items-center
                          justify-center
                        "
                      >
                        👤
                      </div>
                    )}

                    <div>
                      <h3 className="font-bold text-lg">{p.nome}</h3>
                      <p className="text-slate-400 text-sm">{p.empresa}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-green-400 font-bold">CHECK-IN</p>
                    <p className="text-slate-400 text-sm">
                      {new Date(p.data_hora).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* GRÁFICOS */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* BARRAS */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
              <h2 className="text-2xl font-bold mb-6">📈 Presenças na Semana</h2>

              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={dadosPresencas}>
                    <XAxis dataKey="dia" />
                    <YAxis />
                    <Tooltip />
                    <Bar
                      dataKey="total"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* PIZZA */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
              <h2 className="text-2xl font-bold mb-6">🥧 Tipos de Evento</h2>

              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={dadosEventos}
                      dataKey="total"
                      nameKey="nome"
                      outerRadius={100}
                      label
                    >
                      {dadosEventos.map((_, index) => (
                        <Cell
                          key={index}
                          fill={['#3b82f6', '#22c55e', '#f97316'][index]}
                        />
                      ))}
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
              <h2 className="text-3xl font-bold">🏆 Ranking de Participantes</h2>

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
                      <h3 className="text-xl font-bold">{p.nome}</h3>
                      <p className="text-slate-400 text-sm">Participante</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <h2 className="text-3xl font-bold">{p.total}</h2>
                    <p className="text-slate-400 text-sm">presenças</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </LayoutAdmin>
    </Protegido>
  )
}

/* CARD */
function Card({ titulo, valor, cor, icone }: any) {
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
          <p className="text-white/80 text-sm">{titulo}</p>
          <h2 className="text-5xl font-bold mt-3">{valor}</h2>
        </div>

        <div className="text-5xl">{icone}</div>
      </div>
    </div>
  )
}

```