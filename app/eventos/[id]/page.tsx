'use client'

import LayoutAdmin from '@/app/components/LayoutAdmin'
import Protegido from '@/app/components/Protegido'
import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useParams } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import jsPDF from 'jspdf'
import { Scanner } from '@yudiel/react-qr-scanner'

import {
  formatarDataHora,
  formatarHora,
} from '@/app/lib/data'

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

  const [evento, setEvento] = useState<Evento | null>(null)
  const [presencas, setPresencas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  /* ESTADOS DO MODO SCANNER */
  const [modoScanner, setModoScanner] = useState(false)
  const [scaneando, setScaneando] = useState(false)
  const [feedbackScan, setFeedbackScan] = useState('')

  /* FILTROS */
  const [filtroEmpresa, setFiltroEmpresa] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')

  useEffect(() => {
    carregar()
  }, [])

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

  /* LÓGICA DO MODO SCANNER (CRACHÁ) */
  async function onScanCracha(texto: string) {
    if (scaneando) return
    setScaneando(true)

    try {
      const dados = JSON.parse(texto)

      if (!dados.nome || !dados.matricula) {
        throw new Error('QR Code inválido: Faltam dados do funcionário.')
      }

      // 🛑 NOVA REGRA: VERIFICA SE JÁ EXISTE NA LISTA
      const jaRegistrado = presencas.find((p) => p.matricula === String(dados.matricula))
      
      if (jaRegistrado) {
        // Se já estiver na lista, dá o aviso amarelo e cancela a gravação
        setFeedbackScan(`⚠️ ${dados.nome} já foi registrado!`)
        
        setTimeout(() => {
          setScaneando(false)
          setFeedbackScan('')
        }, 2000)
        
        return // O "return" faz a função parar aqui e não envia pro Supabase
      }

      // Se passou pela barreira acima, salva no banco normalmente:
      const { error } = await supabase.from('presencas').insert([
        {
          evento_id: evento?.id,
          nome: dados.nome,
          matricula: String(dados.matricula),
          setor: dados.setor || '',
          empresa: dados.empresa || '',
          centro_custo: dados.centro_custo || '', 
          data_hora: new Date().toISOString(),
          foto_url: null, 
        },
      ])

      if (error) throw error

      setFeedbackScan(`✅ ${dados.nome} registrado com sucesso!`)
      carregar()

    } catch (err: any) {
      console.log(err)
      setFeedbackScan(`❌ Erro: ${err.message || 'QR Code inválido.'}`)
    }

    setTimeout(() => {
      setScaneando(false)
      setFeedbackScan('')
    }, 2000)
  }


  /* FILTRO */
  const presencasFiltradas = presencas.filter((p) => {
    const empresaOk = !filtroEmpresa || p.empresa === filtroEmpresa
    const tipoOk = !filtroTipo || evento?.tipo === filtroTipo
    return empresaOk && tipoOk
  })

  /* CSV */
  function exportarCSV() {
    if (!evento) return

    try {
      const linhas = [
        [
          'Nome',
          'Matrícula', // Adicionei Matrícula para ficar completo
          'Setor',
          'Centro de Custo', // Adicionado no relatório CSV
          'Empresa',
          'Data/Hora',
        ],

        ...presencasFiltradas.map((p) => [
          p.nome || '',
          p.matricula || '',
          p.setor || '',
          p.centro_custo || '',
          p.empresa || '',
          p.data_hora ? new Date(p.data_hora).toLocaleString() : '',
        ]),
      ]

      const csv = linhas
        .map((linha) =>
          linha
            .map((campo) => `"${String(campo).replace(/"/g, '""')}"`)
            .join(';')
        )
        .join('\n')

      const blob = new Blob(['\uFEFF' + csv], { // BOM adicionado para acentos
        type: 'text/csv;charset=utf-8;',
      })

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `presencas-${evento.titulo}.csv`)
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
      const autoTable = (await import('jspdf-autotable')).default
      const doc = new jsPDF()

      doc.setFontSize(20)
      doc.text(`Relatório - ${evento.titulo}`, 14, 20)
      doc.setFontSize(11)
      doc.text(`Tipo: ${evento.tipo}`, 14, 32)
      doc.text(`Instrutor: ${evento.instrutor}`, 14, 40)
      doc.text(`Data: ${evento.data}`, 14, 48)

      autoTable(doc, {
        startY: 60,
        head: [['Nome', 'Matrícula', 'Setor', 'Empresa', 'Hora']], // Ajuste do cabeçalho
        body: presencasFiltradas.map((p) => [
          p.nome || '',
          p.matricula || '',
          p.setor || '',
          p.empresa || '',
          p.data_hora ? new Date(p.data_hora).toLocaleTimeString() : '',
        ]),
      })

      doc.save(`relatorio-${evento.titulo}.pdf`)
    } catch (err) {
      console.log(err)
      alert('Erro ao gerar PDF')
    }
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

  const linkPresenca = `https://treinacheck.vercel.app/presenca/${evento.codigo}`

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
            <div className="xl:col-span-2 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
                <h2 className="text-2xl font-bold mb-6 text-white">
                  📋 Informações
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Info titulo="📚 Tipo" valor={evento.tipo} />
                  <Info titulo="📅 Data" valor={evento.data} />
                  <Info titulo="👨‍🏫 Instrutor" valor={evento.instrutor} />
                  <Info titulo="👥 Participantes" valor={presencasFiltradas.length} />
                  <Info
                    titulo="📸 Selfie"
                    valor={evento.exigir_selfie ? 'Obrigatória' : 'Opcional'}
                  />
                </div>
              </div>

              {/* ÁREA DO SCANNER DE CRACHÁS */}
              <div className="bg-slate-900 border border-blue-900/50 rounded-3xl p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    📸 Modo Scanner
                  </h2>
                  <button
                    onClick={() => setModoScanner(!modoScanner)}
                    className={`px-6 py-3 rounded-2xl font-bold transition-all ${
                      modoScanner 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {modoScanner ? 'Fechar Câmera' : 'Abrir Câmera'}
                  </button>
                </div>

                {modoScanner ? (
                  <div className="space-y-4 flex flex-col items-center">
                    <p className="text-slate-400 text-center">
                      Aponte a câmera para o QR Code do crachá do funcionário.
                    </p>
                    
                    <div className="w-full max-w-sm rounded-3xl overflow-hidden border-4 border-blue-600/50 relative">
                      <Scanner 
                        onScan={(result) => {
                          if (result && result.length > 0) {
                            onScanCracha(result[0].rawValue)
                          }
                        }} 
                        formats={['qr_code']}
                      />
                      
                      {/* Overlay de Feedback Visul em cima da Câmera */}
                      {feedbackScan && (
                        <div className={`absolute inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm z-10 transition-all`}>
                          <div className={`p-4 rounded-xl font-bold text-center ${
                            feedbackScan.includes('✅') ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                          }`}>
                            {feedbackScan}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500">
                    Use o modo scanner para registrar a presença rapidamente lendo o crachá dos funcionários.
                  </p>
                )}
              </div>
            </div>

            {/* QR CODE GERAL DO EVENTO */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center">
              <h2 className="text-2xl font-bold mb-2 text-white">
                📲 QR Code do Evento
              </h2>
              <p className="text-slate-400 text-sm mb-6 text-center">
                Para funcionários fazerem o próprio Check-in.
              </p>

              <div className="bg-white p-5 rounded-3xl">
                <QRCodeSVG value={linkPresenca} size={220} />
              </div>

              <button
                onClick={copiarLink}
                className="mt-6 bg-blue-600 hover:bg-blue-700 transition-all px-5 py-3 rounded-2xl font-semibold w-full text-white"
              >
                Copiar Link
              </button>

              <button
                onClick={exportarCSV}
                className="mt-3 bg-green-600 hover:bg-green-700 transition-all px-5 py-3 rounded-2xl font-semibold w-full text-white"
              >
                Exportar CSV
              </button>

              <button
                onClick={exportarPDF}
                className="mt-3 bg-red-600 hover:bg-red-700 transition-all px-5 py-3 rounded-2xl font-semibold w-full text-white"
              >
                Exportar PDF
              </button>
            </div>
          </div>

          {/* FILTROS E LISTA ABAIXO ... (mantido exatamente como você fez) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <h2 className="text-2xl font-bold mb-5 text-white">
              🔎 Filtros
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={filtroEmpresa}
                onChange={(e) => setFiltroEmpresa(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white"
              >
                <option value="">Todas empresas</option>
                <option value="JAC">JAC</option>
                <option value="BEC">BEC</option>
                <option value="Outros">Outros</option>
              </select>

              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white"
              >
                <option value="">Todos tipos</option>
                <option value="DDS">DDS</option>
                <option value="DDQ">DDQ</option>
                <option value="Treinamento">Treinamento</option>
                <option value="Reunião">Reunião</option>
                <option value="Integração">Integração</option>
                <option value="Gestão de mudança">Gestão de mudança</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-white">
                👥 Lista de Presença
              </h2>

              <div className="bg-slate-800 px-4 py-2 rounded-2xl text-white">
                {presencasFiltradas.length} participantes
              </div>
            </div>

            {presencasFiltradas.length === 0 && (
              <div className="text-center py-16 text-slate-400">
                Nenhuma presença encontrada
              </div>
            )}

            <div className="space-y-4">
              {presencasFiltradas.map((p) => (
                <div
                  key={p.id}
                  className="bg-slate-800 rounded-3xl p-5 flex flex-col md:flex-row md:items-center gap-5"
                >
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white">
                      {p.nome}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                      <MiniInfo titulo="Setor" valor={p.setor} />
                      <MiniInfo titulo="Empresa" valor={p.empresa} />
                      <MiniInfo titulo="Hora" valor={formatarHora(p.data_hora)} />
                    </div>
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

function Info({ titulo, valor }: any) {
  return (
    <div className="bg-slate-800 p-5 rounded-2xl">
      <p className="text-slate-400 text-sm">{titulo}</p>
      <strong className="text-lg text-white">{valor}</strong>
    </div>
  )
}

function MiniInfo({ titulo, valor }: any) {
  return (
    <div className="bg-slate-900 p-3 rounded-2xl">
      <p className="text-slate-500 text-xs">{titulo}</p>
      <strong className="text-white">{valor}</strong>
    </div>
  )
}