'use client'

import LayoutAdmin from '@/app/components/LayoutAdmin'
import Protegido from '@/app/components/Protegido'
import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatarDataHora } from '@/app/lib/data'

type Evento = {
  id: string
  titulo: string
  tipo: string
  data: string
  codigo_evento: string
}

// FUNÇÃO PARA FORMATAR A DATA
function formatarData(dataString: string) {
  if (!dataString) return ''
  const [ano, mes, dia] = dataString.split('-')
  return `${dia}/${mes}/${ano}`
}

export default function Relatorios() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [eventosSelecionados, setEventosSelecionados] = useState<string[]>([])
  const [presencas, setPresencas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState('')

  useEffect(() => {
    buscarEventos()
  }, [])

  async function buscarEventos() {
    // 1. DESCOBRE QUEM ESTÁ LOGADO
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    // 2. BUSCA OS EVENTOS APENAS DESSE USUÁRIO
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .eq('usuario_id', user.id) // <-- O FILTRO DE PRIVACIDADE AQUI
      .order('data', { ascending: false })

    if (error) {
      console.log(error)
      alert('Erro ao buscar eventos')
      return
    }

    setEventos(data || [])
    setLoading(false)
  }

  function toggleEvento(id: string) {
    setEventosSelecionados((prev) =>
      prev.includes(id)
        ? prev.filter((e) => e !== id)
        : [...prev, id]
    )
  }

  const eventosFiltrados = eventos.filter((e) => {
    return !filtroTipo || e.tipo === filtroTipo
  })

  useEffect(() => {
    async function buscarPresencas() {
      if (eventosSelecionados.length === 0) {
        setPresencas([])
        return
      }

      const { data, error } = await supabase
        .from('presencas')
        .select('*')
        .in('evento_id', eventosSelecionados)

      if (error) {
        console.log(error)
        return
      }

      setPresencas(data || [])
    }

    buscarPresencas()
  }, [eventosSelecionados])

  function toggleAll() {
    const ids = eventosFiltrados.map((e) => e.id)

    if (eventosSelecionados.length === ids.length) {
      setEventosSelecionados([])
    } else {
      setEventosSelecionados(ids)
    }
  }

  // CSV
  function exportarCSV() {
    const linhas = [
      [
        'Nome',
        'Matrícula',
        'Setor',
        'Empresa',
        'Evento',
        'Data/Hora',
      ],

      ...presencas.map((p) => {
        const eventoReferente = eventos.find(e => e.id === p.evento_id)
        const nomeEvento = eventoReferente ? eventoReferente.titulo : 'Desconhecido'

        return [
          p.nome || '',
          p.matricula || '',
          p.setor || '',
          p.empresa || '',
          nomeEvento,
          p.data_hora ? formatarDataHora(p.data_hora) : '',
        ]
      }),
    ]

    const csv = linhas
      .map((linha) =>
        linha
          .map((c) => `"${c}"`)
          .join(';')
      )
      .join('\n')

    // BOM adicionado para acentos corretos no Excel
    const blob = new Blob(['\uFEFF' + csv], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'relatorio-presencas.csv'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }

  // PDF
  function exportarPDF() {
    const doc = new jsPDF()

    doc.setFontSize(20)
    doc.text('Relatório de Presenças', 14, 20)

    doc.setFontSize(11)
    doc.text(`Gerado em: ${formatarDataHora(new Date().toISOString())}`, 14, 28)

    autoTable(doc, {
      startY: 40,
      head: [
        [
          'Nome',
          'Matrícula',
          'Setor',
          'Empresa',
          'Evento', 
          'Data/Hora',
        ],
      ],
      body: presencas.map((p) => {
        const eventoReferente = eventos.find(e => e.id === p.evento_id)
        const nomeEvento = eventoReferente ? eventoReferente.titulo : 'Desconhecido'

        return [
          p.nome || '',
          p.matricula || '',
          p.setor || '',
          p.empresa || '',
          nomeEvento, 
          p.data_hora ? formatarDataHora(p.data_hora) : '',
        ]
      }),
    })

    doc.save('relatorio-presencas.pdf')
  }

  if (loading) {
    return <div className="p-10 text-white">Carregando...</div>
  }

  return (
    <Protegido>
      <LayoutAdmin>
        <div className="space-y-8">

          {/* HEADER */}
          <div>
            <h1 className="text-4xl font-bold text-white">
              📄 Relatórios
            </h1>
            <p className="text-slate-400 mt-2">
              Exporte relatórios filtrados
            </p>
          </div>

          {/* FILTRO */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
            <h2 className="text-white font-bold mb-4">
              🔎 Filtrar por tipo
            </h2>

            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="bg-slate-800 p-3 rounded-xl text-white w-full"
            >
              <option value="">Todos</option>
              <option value="DDS">DDS</option>
              <option value="DDQ">DDQ</option>
              <option value="Treinamento">Treinamento</option>
              <option value="Reunião">Reunião</option>
              <option value="Integração">Integração</option>
              <option value="Gestão de Mudança">Gestão de Mudança</option>
            </select>
          </div>

          {/* BOTÕES */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={toggleAll}
              className="bg-slate-700 px-4 py-2 rounded-xl text-white"
            >
              Selecionar visíveis
            </button>

            <button
              onClick={exportarCSV}
              className="bg-green-600 px-4 py-2 rounded-xl text-white"
            >
              Exportar CSV
            </button>

            <button
              onClick={exportarPDF}
              className="bg-red-600 px-4 py-2 rounded-xl text-white"
            >
              Exportar PDF
            </button>

            <div className="ml-auto text-slate-300">
              👥 {eventosSelecionados.length} selecionados
            </div>
          </div>

          {/* LISTA */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 overflow-auto">
            <table className="w-full text-left text-white">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800">
                  <th>✔</th>
                  <th>Código</th>
                  <th>Evento</th>
                  <th>Tipo</th>
                  <th>Data</th>
                </tr>
              </thead>

              <tbody>
                {eventosFiltrados.map((e) => (
                  <tr key={e.id} className="border-t border-slate-800">
                    <td className="py-3">
                      <input
                        type="checkbox"
                        checked={eventosSelecionados.includes(e.id)}
                        onChange={() => toggleEvento(e.id)}
                      />
                    </td>

                    <td className="text-blue-400 font-bold">
                      {e.codigo_evento}
                    </td>
                    <td>{e.titulo}</td>
                    <td>{e.tipo}</td>
                    <td>{formatarData(e.data)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* RESULTADO */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 text-slate-300">
            👥 Presenças encontradas:{' '}
            <strong>{presencas.length}</strong>
          </div>

        </div>
      </LayoutAdmin>
    </Protegido>
  )
}