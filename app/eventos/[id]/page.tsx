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
  const [filaOfflineContagem, setFilaOfflineContagem] = useState(0)

  /* FILTROS */
  const [filtroEmpresa, setFiltroEmpresa] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')

  useEffect(() => {
    carregar()

    // Monitora se a internet voltou para sincronizar a fila offline
    const sincronizarAoVoltarInternet = () => sincronizarFilaOffline()
    window.addEventListener('online', sincronizarAoVoltarInternet)
    
    // Checa se já tem algo guardado offline ao abrir a tela
    atualizarContagemOffline()

    return () => {
      window.removeEventListener('online', sincronizarAoVoltarInternet)
    }
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

  /* PASSO 1: GERADOR DE SONS NATIVOS (Sem precisar de arquivos .mp3) */
  function emitirBip(tipo: 'sucesso' | 'aviso' | 'erro') {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)

      if (tipo === 'sucesso') {
        osc.frequency.setValueAtTime(880, ctx.currentTime) // Som agudo de bip
        gain.gain.setValueAtTime(0.1, ctx.currentTime)
        osc.start()
        osc.stop(ctx.currentTime + 0.1)
      } else if (tipo === 'aviso') {
        osc.frequency.setValueAtTime(440, ctx.currentTime) // Som médio de alerta
        gain.gain.setValueAtTime(0.1, ctx.currentTime)
        osc.start()
        osc.stop(ctx.currentTime + 0.2)
      } else {
        osc.frequency.setValueAtTime(150, ctx.currentTime) // Som grave de erro/buzina
        gain.gain.setValueAtTime(0.1, ctx.currentTime)
        osc.start()
        osc.stop(ctx.currentTime + 0.3)
      }
    } catch (e) {
      console.log('Áudio não suportado ou bloqueado pelo navegador', e)
    }
  }

  /* PASSO 2: CONTROLE DO COFRE OFFLINE (LocalStorage) */
  function obterFilaOffline(): any[] {
    if (typeof window === 'undefined') return []
    const dados = localStorage.getItem(`offline_event_${params.id}`)
    return dados ? JSON.parse(dados) : []
  }

  function atualizarContagemOffline() {
    setFilaOfflineContagem(obterFilaOffline().length)
  }

  async function sincronizarFilaOffline() {
    if (!navigator.onLine || !evento) return
    
    const fila = obterFilaOffline()
    if (fila.length === 0) return

    console.log(`Sincronizando ${fila.length} presenças guardadas offline...`)

    // Envia lote por lote pro Supabase
    const { error } = await supabase.from('presencas').insert(fila)

    if (!error) {
      localStorage.removeItem(`offline_event_${evento.id}`)
      atualizarContagemOffline()
      carregar()
      alert('⚡ Presenças offline sincronizadas com o servidor!')
    }
  }

  /* LÓGICA DO MODO SCANNER ATUALIZADA (COM FILTRO, SOM E OFFLINE) */
  async function onScanCracha(texto: string) {
    if (scaneando) return
    setScaneando(true)

    try {
      const dados = JSON.parse(texto)

      if (!dados.nome || !dados.matricula) {
        throw new Error('Invalido')
      }

      // 1. Evita Duplicidade (checa na lista atual da tela e na fila offline)
      const jaNaTela = presencas.find((p) => p.matricula === String(dados.matricula))
      const jaNoOffline = obterFilaOffline().find((p) => p.matricula === String(dados.matricula))

      if (jaNaTela || jaNoOffline) {
        emitirBip('aviso')
        setFeedbackScan(`⚠️ ${dados.nome} já foi registrado!`)
        setTimeout(() => { setScaneando(false); setFeedbackScan(''); }, 2000)
        return
      }

      const novaPresenca = {
        evento_id: evento?.id,
        nome: dados.nome,
        matricula: String(dados.matricula),
        setor: dados.setor || '',
        empresa: dados.empresa || '',
        centro_custo: dados.centro_custo || '',
        data_hora: new Date().toISOString(),
        foto_url: null,
      }

      // 2. Se estiver SEM INTERNET, guarda no cofre
      if (!navigator.onLine) {
        const filaAtual = obterFilaOffline()
        filaAtual.push(novaPresenca)
        localStorage.setItem(`offline_event_${evento?.id}`, JSON.stringify(filaAtual))
        
        emitirBip('sucesso')
        setFeedbackScan(`📶 Offline! Guardado no celular: ${dados.nome}`)
        atualizarContagemOffline()
        
        setTimeout(() => { setScaneando(false); setFeedbackScan(''); }, 2000)
        return
      }

      // 3. Se tiver internet, manda normal pro Supabase
      const { error } = await supabase.from('presencas').insert([novaPresenca])
      if (error) throw error

      emitirBip('sucesso')
      setFeedbackScan(`✅ ${dados.nome} registrado!`)
      carregar()

    } catch (err) {
      emitirBip('erro')
      setFeedbackScan(`❌ Erro: QR Code inválido.`)
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

  /* CSV MELHORADO COM CABEÇALHO INTERNO */
  function exportarCSV() {
    if (!evento) return
    try {
      // \uFEFF força o Excel a abrir com acentuação correta em Português
      let csvContent = "\uFEFF";
      
      // Adiciona a ficha técnica do evento no topo da planilha
      csvContent += `NOME DO EVENTO:;${evento.titulo}\n`;
      csvContent += `TIPO DE EVENTO:;${evento.tipo}\n`;
      csvContent += `INSTRUTOR / RESPONSÁVEL:;${evento.instrutor}\n`;
      csvContent += `DATA DO EVENTO:;${evento.data}\n`;
      csvContent += `TOTAL DE PARTICIPANTES:;${presencasFiltradas.length}\n`;
      csvContent += `\n`; // Linha em branco para separar as informações da listagem
      
      // Cabeçalho dos dados dos colaboradores
      const cabecalhoColunas = ['Nome', 'Matrícula', 'Setor', 'Centro de Custo', 'Empresa', 'Data/Hora'];
      csvContent += cabecalhoColunas.join(';') + '\n';
      
      // Adiciona as linhas dos colaboradores presentes
      presencasFiltradas.forEach((p) => {
        const linha = [
          p.nome || '', 
          p.matricula || '', 
          p.setor || '', 
          p.centro_custo || '', 
          p.empresa || '',
          p.data_hora ? new Date(p.data_hora).toLocaleString() : '',
        ];
        // Envolve em aspas duplas para evitar problemas com nomes compostos ou que contenham pontos/vírgulas
        csvContent += linha.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';') + '\n';
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `presencas-${evento.titulo.replace(/\s+/g, '_')}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert('Erro ao exportar CSV')
    }
  }

  /* PDF MELHORADO COM QUEBRA AUTOMÁTICA DE LINHA NO TÍTULO */
  async function exportarPDF() {
    if (!evento) return
    try {
      const autoTable = (await import('jspdf-autotable')).default
      const doc = new jsPDF()
      
      // Configuração estilizada do Título
      doc.setFont('Helvetica', 'bold')
      doc.setFontSize(18)
      doc.setTextColor(33, 43, 54)

      // Quebra o texto automaticamente se ele passar do limite lateral da folha (180mm)
      const linhasTitulo = doc.splitTextToSize(`Relatório - ${evento.titulo}`, 180)
      doc.text(linhasTitulo, 14, 20)

      // Calcula o recuo vertical dinâmico com base em quantas linhas o título ocupou
      let espacamentoY = 20 + (linhasTitulo.length * 7) + 5

      // Subtítulos e metadados do evento
      doc.setFont('Helvetica', 'normal')
      doc.setFontSize(11)
      doc.setTextColor(100, 116, 139)
      
      doc.text(`Tipo: ${evento.tipo}`, 14, espacamentoY)
      espacamentoY += 8
      doc.text(`Instrutor: ${evento.instrutor}`, 14, espacamentoY)
      espacamentoY += 8
      doc.text(`Data: ${evento.data}`, 14, espacamentoY)
      espacamentoY += 12 // Espaço extra antes de desenhar a tabela

      autoTable(doc, {
        startY: espacamentoY,
        head: [['Nome', 'Matrícula', 'Setor', 'Empresa', 'Hora']],
        body: presencasFiltradas.map((p) => [
          p.nome || '', p.matricula || '', p.setor || '', p.empresa || '',
          p.data_hora ? new Date(p.data_hora).toLocaleTimeString() : '',
        ]),
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235] } // Azul corporativo combinando com o app
      })

      doc.save(`relatorio-${evento.titulo.replace(/\s+/g, '_')}.pdf`)
    } catch (err) {
      alert('Erro ao gerar PDF')
    }
  }

  function copiarLink() {
    if (!evento) return
    navigator.clipboard.writeText(linkPresenca)
    alert('Link copiado!')
  }

  if (loading) return <div className="p-5 text-white">Carregando...</div>
  if (!evento) return <div className="p-5 text-white">Evento não encontrado</div>

  const linkPresenca = `https://treinacheck.vercel.app/presenca/${evento.codigo}`

  return (
    <Protegido>
      <LayoutAdmin>
        <div className="space-y-6 p-2 sm:p-0">
          
          {/* HEADER COM STATUS OFFLINE SE HOUVER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white break-words">🎯 {evento.titulo}</h1>
              <p className="text-sm text-slate-400 mt-2">Central completa do evento</p>
            </div>
            
            {filaOfflineContagem > 0 && (
              <button 
                onClick={sincronizarFilaOffline}
                className="bg-amber-600 animate-pulse px-4 py-2 rounded-2xl font-bold text-sm text-white"
              >
                ⚠️ {filaOfflineContagem} registros offline. Clique para Sincronizar
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl">
                <h2 className="text-xl font-bold mb-4 text-white">📋 Informações</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Info titulo="📚 Tipo" valor={evento.tipo} />
                  <Info titulo="📅 Data" valor={evento.data} />
                  <Info titulo="👨‍🏫 Instrutor" valor={evento.instrutor} />
                  <Info titulo="👥 Participantes" valor={presencasFiltradas.length} />
                  <Info titulo="📸 Selfie" valor={evento.exigir_selfie ? 'Obrigatória' : 'Opcional'} />
                </div>
              </div>

              /* MODO SCANNER */
              <div className="bg-slate-900 border border-blue-900/50 rounded-3xl p-5 sm:p-8 shadow-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">📸 Modo Scanner (Crachás)</h2>
                  <button
                    onClick={() => setModoScanner(!modoScanner)}
                    className={`px-4 py-3 rounded-2xl font-bold w-full sm:w-auto text-center ${
                      modoScanner ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                    }`}
                  >
                    {modoScanner ? 'Fechar Câmera' : 'Abrir Câmera'}
                  </button>
                </div>

                {modoScanner ? (
                  <div className="space-y-4 flex flex-col items-center">
                    <div className="w-full max-w-[260px] sm:max-w-sm rounded-3xl overflow-hidden border-4 border-blue-600/50 relative">
                      <Scanner 
                        onScan={(result) => { if (result && result.length > 0) onScanCracha(result[0].rawValue) }} 
                        formats={['qr_code']}
                      />
                      {feedbackScan && (
                        <div className="absolute inset-0 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm z-10">
                          <div className={`p-4 rounded-xl font-bold text-center text-sm ${
                            feedbackScan.includes('✅') ? 'bg-green-500 text-white' : feedbackScan.includes('⚠️') ? 'bg-amber-500 text-black' : 'bg-red-500 text-white'
                          }`}>
                            {feedbackScan}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center sm:text-left">
                    Use a câmera para registrar presenças com bipe sonoro e suporte completo sem internet.
                  </p>
                )}
              </div>
            </div>

            {/* QR CODE EVENTO */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl flex flex-col items-center">
              <h2 className="text-xl font-bold mb-2 text-white">📲 QR Code do Evento</h2>
              <div className="bg-white p-3 rounded-3xl my-4">
                <QRCodeSVG value={linkPresenca} size={180} />
              </div>
              <div className="w-full flex flex-col gap-2">
                <button onClick={copiarLink} className="bg-blue-600 py-3 rounded-2xl font-semibold w-full text-white text-sm">Copiar Link</button>
                <button onClick={exportarCSV} className="bg-green-600 py-3 rounded-2xl font-semibold w-full text-white text-sm">Exportar CSV</button>
                <button onClick={exportarPDF} className="bg-red-600 py-3 rounded-2xl font-semibold w-full text-white text-sm">Exportar PDF</button>
              </div>
            </div>
          </div>

          {/* FILTROS E LISTA DE PRESENÇA */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-white">🔎 Filtros</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select value={filtroEmpresa} onChange={(e) => setFiltroEmpresa(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-sm">
                <option value="">Todas empresas</option>
                <option value="JAC">JAC</option>
                <option value="BEC">BEC</option>
                <option value="Outros">Outros</option>
              </select>
              <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-sm">
                <option value="">Todos tipos</option>
                <option value="DDS">DDS</option>
                <option value="DDQ">DDQ</option>
                <option value="Treinamento">Treinamento</option>
                <option value="Reunião">Reunião</option>
                <option value="Integração">Integração</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">👥 Lista de Presença ({presencasFiltradas.length})</h2>
            </div>
            <div className="space-y-3">
              {presencasFiltradas.map((p) => (
                <div key={p.id} className="bg-slate-800 rounded-2xl p-4 flex flex-col gap-2">
                  <h3 className="text-lg font-bold text-white">{p.nome}</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <MiniInfo titulo="Setor" valor={p.setor} />
                    <MiniInfo titulo="Empresa" valor={p.empresa} />
                    <MiniInfo titulo="Hora" valor={formatarHora(p.data_hora)} />
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
    <div className="bg-slate-800 p-4 rounded-2xl">
      <p className="text-slate-400 text-xs">{titulo}</p>
      <strong className="text-base text-white block truncate">{valor}</strong>
    </div>
  )
}

function MiniInfo({ titulo, valor }: any) {
  return (
    <div className="bg-slate-900 p-2 rounded-xl">
      <p className="text-slate-500 text-[10px] uppercase font-bold">{titulo}</p>
      <strong className="text-white text-xs block truncate">{valor}</strong>
    </div>
  )
}