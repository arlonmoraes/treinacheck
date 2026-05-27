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
}

export default function Relatorios() {
  const [eventos, setEventos] =
    useState<Evento[]>([])

  const [
    eventosSelecionados,
    setEventosSelecionados,
  ] = useState<string[]>([])

  const [presencas, setPresencas] =
    useState<any[]>([])

  const [loading, setLoading] =
    useState(true)

  const [filtroTipo, setFiltroTipo] =
    useState('')

  useEffect(() => {
    buscarEventos()
  }, [])

  async function buscarEventos() {
    const { data, error } =
      await supabase
        .from('eventos')
        .select('*')
        .order('data', {
          ascending: false,
        })

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

  const eventosFiltrados =
    eventos.filter((e) => {
      return (
        !filtroTipo ||
        e.tipo === filtroTipo
      )
    })

  useEffect(() => {
    async function buscarPresencas() {
      if (
        eventosSelecionados.length === 0
      ) {
        setPresencas([])

        return
      }

      const { data, error } =
        await supabase
          .from('presencas')
          .select('*')
          .in(
            'evento_id',
            eventosSelecionados
          )

      if (error) {
        console.log(error)

        return
      }

      setPresencas(data || [])
    }

    buscarPresencas()
  }, [eventosSelecionados])

  function toggleAll() {
    const ids =
      eventosFiltrados.map(
        (e) => e.id
      )

    if (
      eventosSelecionados.length ===
      ids.length
    ) {
      setEventosSelecionados([])
    } else {
      setEventosSelecionados(ids)
    }
  }

  function exportarCSV() {
    const linhas = [
      [
        'Nome',
        'Setor',
        'Empresa',
        'Data/Hora',
      ],

      ...presencas.map((p) => [
        p.nome || '',
        p.setor || '',
        p.empresa || '',

        p.data_hora
          ? formatarDataHora(
              p.data_hora
            )
          : '',
      ]),
    ]

    const csv = linhas
      .map((linha) =>
        linha
          .map((c) => `"${c}"`)
          .join(';')
      )
      .join('\n')

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    })

    const url =
      window.URL.createObjectURL(
        blob
      )

    const link =
      document.createElement('a')

    link.href = url

    link.download =
      'relatorio.csv'

    document.body.appendChild(link)

    link.click()

    link.remove()

    window.URL.revokeObjectURL(url)
  }

  async function exportarPDF() {
    const doc = new jsPDF()

    doc.text(
      'Relatório de Presenças',
      14,
      20
    )

    autoTable(doc, {
      startY: 30,

      head: [
        [
          'Nome',
          'Setor',
          'Empresa',
          'Data',
        ],
      ],

      body: presencas.map((p) => [
        p.nome || '',
        p.setor || '',
        p.empresa || '',

        p.data_hora
          ? formatarDataHora(
              p.data_hora
            )
          : '',
      ]),
    })

    doc.save('relatorio.pdf')
  }

  if (loading) {
    return (
      <div className="p-10 text-white">
        Carregando...
      </div>
    )
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
              onChange={(e) =>
                setFiltroTipo(
                  e.target.value
                )
              }
              className="
                bg-slate-800
                p-3
                rounded-xl
                text-white
                w-full
              "
            >
              <option value="">
                Todos
              </option>

              <option value="DDS">
                DDS
              </option>

              <option value="DDQ">
                DDQ
              </option>

              <option value="Treinamento">
                Treinamento
              </option>

              <option value="Reunião">
                Reunião
              </option>

              <option value="Integração">
                Integração
              </option>

              <option value="Gestão de mudança">
                Gestão de mudança
              </option>
            </select>
          </div>

          {/* BOTÕES */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={toggleAll}
              className="
                bg-slate-700
                hover:bg-slate-600
                transition-all
                px-4
                py-2
                rounded-xl
                text-white
              "
            >
              Selecionar visíveis
            </button>

            <button
              onClick={exportarCSV}
              className="
                bg-green-600
                hover:bg-green-700
                transition-all
                px-4
                py-2
                rounded-xl
                text-white
              "
            >
              Exportar CSV
            </button>

            <button
              onClick={exportarPDF}
              className="
                bg-red-600
                hover:bg-red-700
                transition-all
                px-4
                py-2
                rounded-xl
                text-white
              "
            >
              Exportar PDF
            </button>

            <div className="ml-auto text-slate-300 flex items-center">
              👥 {eventosSelecionados.length} selecionados
            </div>
          </div>

          {/* LISTA */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 overflow-auto">
            <table className="w-full text-left text-white">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800">
                  <th className="p-3">
                    ✔
                  </th>

                  <th className="p-3">
                    Evento
                  </th>

                  <th className="p-3">
                    Tipo
                  </th>

                  <th className="p-3">
                    Data
                  </th>
                </tr>
              </thead>

              <tbody>
                {eventosFiltrados.map(
                  (e) => (
                    <tr
                      key={e.id}
                      className="border-t border-slate-800"
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={eventosSelecionados.includes(
                            e.id
                          )}
                          onChange={() =>
                            toggleEvento(
                              e.id
                            )
                          }
                        />
                      </td>

                      <td className="p-3">
                        {e.titulo}
                      </td>

                      <td className="p-3">
                        {e.tipo}
                      </td>

                      <td className="p-3">
                        {e.data}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* RESULTADO */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 text-slate-300">
            👥 Presenças encontradas:{' '}
            <strong>
              {presencas.length}
            </strong>
          </div>

        </div>
      </LayoutAdmin>
    </Protegido>
  )
}