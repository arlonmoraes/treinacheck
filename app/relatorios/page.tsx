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

  // 🔥 BUSCA PRESENÇAS AUTOMÁTICA
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

  // 📄 CSV
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
        linha
          .map((campo) =>
            `"${String(campo).replace(/"/g, '""')}"`
          )
          .join(';')
      )
      .join('\n')

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = window.URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.setAttribute(
      'download',
      `relatorio-presencas.csv`
    )

    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  // 📄 PDF
  async function exportarPDF() {
    const doc = new jsPDF()

    doc.setFontSize(18)
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

    doc.save('relatorio-presencas.pdf')
  }

  function toggleAll() {
    if (eventosSelecionados.length === eventos.length) {
      setEventosSelecionados([])
    } else {
      setEventosSelecionados(eventos.map((e) => e.id))
    }
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
              Selecione os eventos para gerar relatório consolidado
            </p>
          </div>

          {/* BOTÕES */}
          <div className="flex gap-3">
            <button
              onClick={toggleAll}
              className="bg-slate-700 px-4 py-2 rounded-xl text-white"
            >
              Selecionar todos
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
              {eventosSelecionados.length} eventos selecionados
            </div>
          </div>

          {/* LISTA DE EVENTOS */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-auto">

            {loading ? (
              <div className="text-slate-400">
                Carregando...
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400">
                    <th className="p-4">Selecionar</th>
                    <th className="p-4">Evento</th>
                    <th className="p-4">Tipo</th>
                    <th className="p-4">Data</th>
                  </tr>
                </thead>

                <tbody>
                  {eventos.map((evento) => (
                    <tr
                      key={evento.id}
                      className="border-b border-slate-800 hover:bg-slate-800"
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={eventosSelecionados.includes(evento.id)}
                          onChange={() => toggleEvento(evento.id)}
                        />
                      </td>

                      <td className="p-4 text-white font-medium">
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
            )}
          </div>

          {/* PREVIEW PRESENÇAS */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              👥 Prévia das Presenças ({presencas.length})
            </h2>

            {presencas.length === 0 ? (
              <p className="text-slate-400">
                Nenhum evento selecionado
              </p>
            ) : (
              <div className="space-y-2">
                {presencas.slice(0, 10).map((p) => (
                  <div
                    key={p.id}
                    className="text-slate-300 border-b border-slate-800 py-2"
                  >
                    {p.nome} - {p.empresa}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </LayoutAdmin>
    </Protegido>
  )
}