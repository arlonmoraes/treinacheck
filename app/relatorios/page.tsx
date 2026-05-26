'use client'

import LayoutAdmin from '@/app/components/LayoutAdmin'
import Protegido from '@/app/components/Protegido'
import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

type Evento = {
  id: string
  titulo: string
  tipo: string
  data: string
}

export default function Relatorios() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [eventosSelecionados, setEventosSelecionados] = useState<string[]>([])
  const [presencas, setPresencas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // 🔥 NOVO FILTRO
  const [filtroTipo, setFiltroTipo] = useState('')

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

  function toggleEvento(id: string) {
    setEventosSelecionados((prev) =>
      prev.includes(id)
        ? prev.filter((e) => e !== id)
        : [...prev, id]
    )
  }

  // 🔥 FILTRA POR TIPO
  const eventosFiltrados = eventos.filter((e) => {
    return !filtroTipo || e.tipo === filtroTipo
  })

  // 🔥 BUSCA PRESENÇAS
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

  function exportarCSV() {
    const linhas = [
      ['Nome', 'Setor', 'Empresa', 'Data/Hora'],
      ...presencas.map((p) => [
        p.nome || '',
        p.setor || '',
        p.empresa || '',
        p.data_hora
          ? new Date(p.data_hora).toLocaleString()
          : '',
      ]),
    ]

    const csv = linhas
      .map((linha) =>
        linha.map((c) => `"${c}"`).join(';')
      )
      .join('\n')

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = 'relatorio.csv'
    link.click()
  }

  async function exportarPDF() {
    const doc = new jsPDF()

    doc.text('Relatório de Presenças', 14, 20)

    autoTable(doc, {
      startY: 30,
      head: [['Nome', 'Setor', 'Empresa', 'Data']],
      body: presencas.map((p) => [
        p.nome || '',
        p.setor || '',
        p.empresa || '',
        p.data_hora
          ? new Date(p.data_hora).toLocaleString()
          : '',
      ]),
    })

    doc.save('relatorio.pdf')
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
          </div>

          {/* 🔥 FILTRO POR TIPO */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
            <h2 className="text-white font-bold mb-4">
              🔎 Filtrar por tipo de evento
            </h2>

            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="bg-slate-800 p-3 rounded-xl text-white"
            >
              <option value="">Todos</option>
              <option value="DDS">DDS</option>
              <option value="DDQ">DDQ</option>
              <option value="Treinamento">Treinamento</option>
              <option value="Reunião">Reunião</option>
              <option value="Integração">Integração</option>
              <option value="Gestão de mudança">Gestão de mudança</option>
            </select>
          </div>

          {/* BOTÕES */}
          <div className="flex gap-3">
            <button onClick={toggleAll} className="bg-slate-700 px-4 py-2 rounded-xl text-white">
              Selecionar visíveis
            </button>

            <button onClick={exportarCSV} className="bg-green-600 px-4 py-2 rounded-xl text-white">
              CSV
            </button>

            <button onClick={exportarPDF} className="bg-red-600 px-4 py-2 rounded-xl text-white">
              PDF
            </button>

            <div className="ml-auto text-slate-300">
              {eventosSelecionados.length} selecionados
            </div>
          </div>

          {/* LISTA */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
            <table className="w-full text-left text-white">
              <thead>
                <tr className="text-slate-400">
                  <th className="p-3">✔</th>
                  <th className="p-3">Evento</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Data</th>
                </tr>
              </thead>

              <tbody>
                {eventosFiltrados.map((e) => (
                  <tr key={e.id} className="border-t border-slate-800">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={eventosSelecionados.includes(e.id)}
                        onChange={() => toggleEvento(e.id)}
                      />
                    </td>

                    <td className="p-3">{e.titulo}</td>
                    <td className="p-3">{e.tipo}</td>
                    <td className="p-3">{e.data}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PREVIEW */}
          <div className="text-slate-300">
            👥 Presenças encontradas: {presencas.length}
          </div>

        </div>
      </LayoutAdmin>
    </Protegido>
  )
}