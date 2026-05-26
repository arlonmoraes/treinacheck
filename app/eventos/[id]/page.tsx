'use client'

import LayoutAdmin from '@/app/components/LayoutAdmin'
import Protegido from '@/app/components/Protegido'
import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useParams } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import jsPDF from 'jspdf'

type Evento = {
  id: string
  titulo: string
  tipo: string
  data: string
  instrutor: string
  codigo: string
  exigir_selfie: boolean
}

export default function EventoDetalhe() {
  const params = useParams()

  const [evento, setEvento] =
    useState<Evento | null>(null)

  const [presencas, setPresencas] =
    useState<any[]>([])

  const [loading, setLoading] =
    useState(true)

  /* FILTROS */
  const [filtroEmpresa, setFiltroEmpresa] =
    useState('')

  const [filtroTipo, setFiltroTipo] =
    useState('')

  useEffect(() => {
    async function carregar() {
      const id = params.id as string

      if (!id) return

      const { data, error } =
        await supabase
          .from('eventos')
          .select('*')
          .eq('id', id)
          .single()

      if (error) {
        console.log(error)

        alert('Erro ao buscar evento')

        setLoading(false)

        return
      }

      setEvento(data)

      const { data: lista } =
        await supabase
          .from('presencas')
          .select('*')
          .eq('evento_id', data.id)
          .order('data_hora', {
            ascending: false,
          })

      setPresencas(lista || [])

      setLoading(false)
    }

    carregar()
  }, [])

  /* FILTRO */
  const presencasFiltradas =
    presencas.filter((p) => {
      const empresaOk =
        !filtroEmpresa ||
        p.empresa === filtroEmpresa

      const tipoOk =
        !filtroTipo ||
        evento?.tipo === filtroTipo

      return empresaOk && tipoOk
    })

  /* CSV */
  function exportarCSV() {
    if (!evento) return

    try {
      const linhas = [
        [
          'Nome',
          'Setor',
          'Empresa',
          'Data/Hora',
        ],

        ...presencasFiltradas.map(
          (p) => [
            p.nome || '',
            p.setor || '',
            p.empresa || '',

            p.data_hora
              ? new Date(
                  p.data_hora
                ).toLocaleString()
              : '',
          ]
        ),
      ]

      const csv = linhas
        .map((linha) =>
          linha
            .map((campo) =>
              `"${String(campo).replace(
                /"/g,
                '""'
              )}"`
            )
            .join(';')
        )
        .join('\n')

      const blob = new Blob([csv], {
        type: 'text/csv;charset=utf-8;',
      })

      const url =
        window.URL.createObjectURL(blob)

      const link =
        document.createElement('a')

      link.href = url

      link.setAttribute(
        'download',
        `presencas-${evento.titulo}.csv`
      )

      document.body.appendChild(link)

      link.click()

      link.remove()

      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.log(err)

      alert('Erro ao exportar CSV')
    }
  }

  /* PDF */
  async function exportarPDF() {
    if (!evento) return

    try {
      const autoTable =
        (await import(
          'jspdf-autotable'
        )).default

      const doc = new jsPDF()

      doc.setFontSize(20)

      doc.text(
        `Relatório - ${evento.titulo}`,
        14,
        20
      )

      doc.setFontSize(11)

      doc.text(
        `Tipo: ${evento.tipo}`,
        14,
        32
      )

      doc.text(
        `Instrutor: ${evento.instrutor}`,
        14,
        40
      )

      doc.text(
        `Data: ${evento.data}`,
        14,
        48
      )

      autoTable(doc, {
        startY: 60,

        head: [
          [
            'Nome',
            'Setor',
            'Empresa',
            'Hora',
          ],
        ],

        body:
          presencasFiltradas.map(
            (p) => [
              p.nome || '',
              p.setor || '',
              p.empresa || '',

              p.data_hora
                ? new Date(
                    p.data_hora
                  ).toLocaleTimeString()
                : '',
            ]
          ),
      })

      doc.save(
        `relatorio-${evento.titulo}.pdf`
      )
    } catch (err) {
      console.log(err)

      alert('Erro ao gerar PDF')
    }
  }

  function copiarLink() {
    if (!evento) return

    navigator.clipboard.writeText(
      linkPresenca
    )

    alert('Link copiado!')
  }

  if (loading) {
    return (
      <div className="p-10 text-white">
        Carregando...
      </div>
    )
  }

  if (!evento) {
    return (
      <div className="p-10 text-white">
        Evento não encontrado
      </div>
    )
  }

  const linkPresenca = `https://minhalista.bba.ind.br/presenca/${evento.codigo}`

  return (
    <Protegido>
      <LayoutAdmin>
        <div className="space-y-8">
          {/* HEADER */}
          <div>
            <h1 className="text-4xl font-bold text-white">
              🎯 {evento.titulo}
            </h1>

            <p className="text-slate-400 mt-2">
              Central completa do evento
            </p>
          </div>

          {/* GRID */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* INFOS */}
            <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
              <h2 className="text-2xl font-bold mb-6 text-white">
                📋 Informações
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Info
                  titulo="📚 Tipo"
                  valor={evento.tipo}
                />

                <Info
                  titulo="📅 Data"
                  valor={evento.data}
                />

                <Info
                  titulo="👨‍🏫 Instrutor"
                  valor={evento.instrutor}
                />

                <Info
                  titulo="👥 Participantes"
                  valor={
                    presencasFiltradas.length
                  }
                />

                <Info
                  titulo="📸 Selfie"
                  valor={
                    evento.exigir_selfie
                      ? 'Obrigatória'
                      : 'Opcional'
                  }
                />
              </div>
            </div>

            {/* QR CODE */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center">
              <h2 className="text-2xl font-bold mb-6 text-white">
                📲 QR Code
              </h2>

              <div className="bg-white p-5 rounded-3xl">
                <QRCodeSVG
                  value={linkPresenca}
                  size={220}
                />
              </div>

              <button
                onClick={copiarLink}
                className="
                  mt-6
                  bg-blue-600
                  hover:bg-blue-700
                  transition-all
                  px-5
                  py-3
                  rounded-2xl
                  font-semibold
                  w-full
                "
              >
                Copiar Link
              </button>

              <button
                onClick={exportarCSV}
                className="
                  mt-3
                  bg-green-600
                  hover:bg-green-700
                  transition-all
                  px-5
                  py-3
                  rounded-2xl
                  font-semibold
                  w-full
                "
              >
                Exportar CSV
              </button>

              <button
                onClick={exportarPDF}
                className="
                  mt-3
                  bg-red-600
                  hover:bg-red-700
                  transition-all
                  px-5
                  py-3
                  rounded-2xl
                  font-semibold
                  w-full
                "
              >
                Exportar PDF
              </button>
            </div>
          </div>

          {/* FILTROS */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <h2 className="text-2xl font-bold mb-5">
              🔎 Filtros
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* EMPRESA */}
              <select
                value={filtroEmpresa}
                onChange={(e) =>
                  setFiltroEmpresa(
                    e.target.value
                  )
                }
                className="
                  bg-slate-800
                  border
                  border-slate-700
                  rounded-2xl
                  p-4
                "
              >
                <option value="">
                  Todas empresas
                </option>

                <option value="BBA">
                  BBA
                </option>

                <option value="SUMA">
                  SUMA
                </option>

                <option value="Outros">
                  Outros
                </option>
              </select>

              {/* TIPO */}
              <select
                value={filtroTipo}
                onChange={(e) =>
                  setFiltroTipo(
                    e.target.value
                  )
                }
                className="
                  bg-slate-800
                  border
                  border-slate-700
                  rounded-2xl
                  p-4
                "
              >
                <option value="">
                  Todos tipos
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
          </div>

          {/* LISTA */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-white">
                👥 Lista de Presença
              </h2>

              <div className="bg-slate-800 px-4 py-2 rounded-2xl text-white">
                {
                  presencasFiltradas.length
                }{' '}
                participantes
              </div>
            </div>

            {presencasFiltradas.length ===
              0 && (
              <div className="text-center py-16 text-slate-400">
                Nenhuma presença encontrada
              </div>
            )}

            <div className="space-y-4">
              {presencasFiltradas.map(
                (p) => (
                  <div
                    key={p.id}
                    className="
                      bg-slate-800
                      rounded-3xl
                      p-5
                      flex
                      flex-col
                      md:flex-row
                      md:items-center
                      gap-5
                    "
                  >
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white">
                        {p.nome}
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                        <MiniInfo
                          titulo="Setor"
                          valor={
                            p.setor
                          }
                        />

                        <MiniInfo
                          titulo="Empresa"
                          valor={
                            p.empresa
                          }
                        />

                        <MiniInfo
                          titulo="Hora"
                          valor={new Date(
                            p.data_hora
                          ).toLocaleTimeString()}
                        />
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
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
    <div className="bg-slate-800 p-5 rounded-2xl">
      <p className="text-slate-400 text-sm">
        {titulo}
      </p>

      <strong className="text-lg text-white">
        {valor}
      </strong>
    </div>
  )
}

/* MINI INFO */
function MiniInfo({
  titulo,
  valor,
}: any) {
  return (
    <div className="bg-slate-900 p-3 rounded-2xl">
      <p className="text-slate-500 text-xs">
        {titulo}
      </p>

      <strong className="text-white">
        {valor}
      </strong>
    </div>
  )
}