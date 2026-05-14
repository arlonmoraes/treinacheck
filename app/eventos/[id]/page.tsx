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
  status?: string
  exigir_selfie: boolean
}

export default function EventoDetalhe() {
  const params = useParams()

  const [evento, setEvento] = useState<Evento | null>(null)
  const [presencas, setPresencas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregar() {
      const id = params.id as string

      if (!id) return

      const { data, error } = await supabase
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

      const { data: lista } = await supabase
        .from('presencas')
        .select('*')
        .eq('evento_id', data.id)
        .order('data_hora', { ascending: false })

      setPresencas(lista || [])
      setLoading(false)
    }

    carregar()
  }, [])

  /* 🚨 PASSO 4 - ENCERRAR EVENTO MANUAL */
  async function encerrarEvento() {
    if (!evento) return

    const confirm = window.confirm(
      'Deseja realmente encerrar este evento?'
    )

    if (!confirm) return

    const { error } = await supabase
      .from('eventos')
      .update({ status: 'Encerrado' })
      .eq('id', evento.id)

    if (error) {
      console.log(error)
      alert('Erro ao encerrar evento')
      return
    }

    setEvento({
      ...evento,
      status: 'Encerrado',
    })

    alert('Evento encerrado com sucesso!')
  }

  /* CSV */
  function exportarCSV() {
    if (!evento) return

    const linhas = [
      ['Nome', 'Matrícula', 'Setor', 'Empresa', 'Data/Hora'],

      ...presencas.map((p) => [
        p.nome || '',
        p.matricula || '',
        p.setor || '',
        p.empresa || '',
        p.data_hora
          ? new Date(p.data_hora).toLocaleString()
          : '',
      ]),
    ]

    const csv = linhas
      .map((linha) =>
        linha.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')
      )
      .join('\n')

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = window.URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `presencas-${evento.titulo}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  /* PDF */
  async function exportarPDF() {
    if (!evento) return

    const autoTable = (await import('jspdf-autotable')).default

    const doc = new jsPDF()

    doc.setFontSize(18)
    doc.text(`Relatório - ${evento.titulo}`, 14, 20)

    doc.setFontSize(11)
    doc.text(`Tipo: ${evento.tipo}`, 14, 32)
    doc.text(`Instrutor: ${evento.instrutor}`, 14, 40)
    doc.text(`Data: ${evento.data}`, 14, 48)

    autoTable(doc, {
      startY: 60,
      head: [['Nome', 'Matrícula', 'Setor', 'Empresa', 'Hora']],
      body: presencas.map((p) => [
        p.nome || '',
        p.matricula || '',
        p.setor || '',
        p.empresa || '',
        p.data_hora
          ? new Date(p.data_hora).toLocaleTimeString()
          : '',
      ]),
    })

    doc.save(`relatorio-${evento.titulo}.pdf`)
  }

  function copiarLink() {
    if (!evento) return

    navigator.clipboard.writeText(linkPresenca)
    alert('Link copiado!')
  }

  if (loading) {
    return <div className="p-10 text-white">Carregando...</div>
  }

  if (!evento) {
    return <div className="p-10 text-white">Evento não encontrado</div>
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

            {/* 🔥 BOTÃO ENCERRAR */}
            <button
              onClick={encerrarEvento}
              className="
                mt-4
                bg-red-600
                hover:bg-red-700
                px-5
                py-3
                rounded-2xl
                font-bold
                text-white
              "
            >
              ⛔ Encerrar Evento
            </button>

            {evento.status === 'Encerrado' && (
              <p className="text-red-400 mt-2">
                Evento encerrado
              </p>
            )}
          </div>

          {/* GRID */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* INFOS */}
            <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
              <h2 className="text-2xl font-bold mb-6 text-white">
                📋 Informações
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Info titulo="📚 Tipo" valor={evento.tipo} />
                <Info titulo="📅 Data" valor={evento.data} />
                <Info titulo="👨‍🏫 Instrutor" valor={evento.instrutor} />
                <Info titulo="👥 Participantes" valor={presencas.length} />
                <Info
                  titulo="📸 Selfie"
                  valor={evento.exigir_selfie ? 'Obrigatória' : 'Opcional'}
                />
                <Info
                  titulo="🔐 Código"
                  valor={evento.codigo.slice(0, 8)}
                />
              </div>
            </div>

            {/* QR */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center">
              <h2 className="text-2xl font-bold mb-6 text-white">
                📲 QR Code
              </h2>

              <div className="bg-white p-5 rounded-3xl">
                <QRCodeSVG value={linkPresenca} size={220} />
              </div>

              <button onClick={copiarLink} className="btn">
                Copiar Link
              </button>

              <button onClick={exportarCSV} className="btn">
                Exportar CSV
              </button>

              <button onClick={exportarPDF} className="btn">
                Exportar PDF
              </button>
            </div>
          </div>
        </div>
      </LayoutAdmin>
    </Protegido>
  )
}

/* UI */
function Info({ titulo, valor }: any) {
  return (
    <div className="bg-slate-800 p-5 rounded-2xl">
      <p className="text-slate-400 text-sm">{titulo}</p>
      <strong className="text-white text-lg">{valor}</strong>
    </div>
  )
}