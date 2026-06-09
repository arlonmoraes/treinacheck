'use client'

import LayoutAdmin from '@/app/components/LayoutAdmin'
import Protegido from '@/app/components/Protegido'
import { useState, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'

type DadosCracha = {
  nome: string
  matricula: string
  setor: string
  empresa: string
}

export default function GeradorCrachas() {
  const [modo, setModo] = useState<'individual' | 'lote'>('individual')
  
  // Estados - Individual
  const [nome, setNome] = useState('')
  const [matricula, setMatricula] = useState('')
  const [setor, setSetor] = useState('')
  const [empresa, setEmpresa] = useState('JAC')

  // Estados - Lote
  const [listaLote, setListaLote] = useState<DadosCracha[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Gera o JSON para o modo individual
  const stringJsonIndividual = JSON.stringify({
    nome: nome.toUpperCase().trim(),
    matricula: matricula.trim(),
    setor: setor.toUpperCase().trim(),
    empresa: empresa
  })

  function limparFormulario() {
    setNome('')
    setMatricula('')
    setSetor('')
  }

  function imprimir() {
    window.print()
  }

  // --- LÓGICA DE IMPORTAÇÃO DE PLANILHA (CSV) ---
  function processarArquivoCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evento) => {
      const texto = evento.target?.result as string
      
      const linhas = texto.split('\n')
      const separador = linhas[0].includes(';') ? ';' : ','
      const cabecalho = linhas[0].toLowerCase().split(separador).map(c => c.trim())

      const idxNome = cabecalho.findIndex(c => c.includes('nome'))
      const idxMatricula = cabecalho.findIndex(c => c.includes('matr'))
      const idxSetor = cabecalho.findIndex(c => c.includes('setor') || c.includes('area'))
      const idxEmpresa = cabecalho.findIndex(c => c.includes('empresa'))

      if (idxNome === -1 || idxMatricula === -1) {
        alert('A planilha precisa ter pelo menos as colunas "Nome" e "Matricula".')
        return
      }

      const crachasLidos: DadosCracha[] = []

      for (let i = 1; i < linhas.length; i++) {
        if (!linhas[i].trim()) continue

        const colunas = linhas[i].split(separador).map(c => c.trim().replace(/"/g, ''))
        
        crachasLidos.push({
          nome: colunas[idxNome] || '',
          matricula: colunas[idxMatricula] || '',
          setor: idxSetor !== -1 ? colunas[idxSetor] : '',
          empresa: idxEmpresa !== -1 ? colunas[idxEmpresa] : 'JAC'
        })
      }

      setListaLote(crachasLidos)
      alert(`✅ ${crachasLidos.length} funcionários importados com sucesso!`)
    }

    reader.readAsText(file, 'utf-8')
  }

  return (
    <Protegido>
      <LayoutAdmin>
        <div className="space-y-8 p-2 sm:p-0 print:hidden">
          <div>
            <h1 className="text-4xl font-bold text-white">🏷️ Gerador de Crachás</h1>
            <p className="text-slate-400 mt-2">Crie e imprima os QR Codes de identificação</p>
          </div>

          <div className="flex flex-col sm:flex-row bg-slate-900 rounded-2xl p-2 w-fit border border-slate-800 gap-2">
            <button 
              onClick={() => setModo('individual')}
              className={`px-6 py-2 rounded-xl font-bold transition-all ${modo === 'individual' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              👤 Um por um
            </button>
            <button 
              onClick={() => setModo('lote')}
              className={`px-6 py-2 rounded-xl font-bold transition-all ${modo === 'lote' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              📄 Em Lote (Planilha)
            </button>
          </div>

          {modo === 'individual' ? (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
                <h2 className="text-xl font-bold text-white mb-2">📋 Dados do Funcionário</h2>
                
                <div>
                  <label className="text-sm text-slate-400 block mb-2 font-medium">Nome Completo</label>
                  <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: CARLOS HENRIQUE" className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 outline-none text-white focus:border-blue-500 transition-all"/>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400 block mb-2 font-medium">Matrícula</label>
                    <input type="text" value={matricula} onChange={(e) => setMatricula(e.target.value)} placeholder="Ex: 765" className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 outline-none text-white focus:border-blue-500 transition-all"/>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 block mb-2 font-medium">Empresa</label>
                    <select value={empresa} onChange={(e) => setEmpresa(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 outline-none text-white focus:border-blue-500 transition-all">
                      <option value="JAC">JAC</option>
                      <option value="BEC">BEC</option>
                      <option value="BBA">BBA</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-slate-400 block mb-2 font-medium">Setor/Área</label>
                  <input type="text" value={setor} onChange={(e) => setSetor(e.target.value)} placeholder="Ex: PRODUÇÃO DE BILIS" className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 outline-none text-white focus:border-blue-500 transition-all"/>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button onClick={imprimir} disabled={!nome || !matricula} className="flex-1 bg-blue-600 disabled:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all shadow-lg hover:bg-blue-700">🖨️ Imprimir Crachá</button>
                  <button onClick={limparFormulario} className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-8 py-4 rounded-2xl transition-all">Limpar</button>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center justify-center">
                <h2 className="text-xl font-bold text-white mb-8">👁️ Pré-visualização</h2>
                <CartaoCracha dados={{ nome, matricula, setor, empresa }} />
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="border-2 border-dashed border-slate-700 rounded-3xl p-8 sm:p-12 flex flex-col items-center justify-center text-center">
                <div className="text-5xl mb-6">📁</div>
                <h3 className="text-2xl font-bold text-white mb-3">Importar planilha (CSV)</h3>
                <p className="text-slate-400 max-w-lg mb-8 leading-relaxed">
                  Salve sua planilha do Excel no formato <strong>"CSV (separado por vírgulas)"</strong>. Certifique-se de que ela tenha as colunas: <strong className="text-slate-300">Nome, Matricula, Empresa e Setor</strong>.
                </p>
                <input 
                  type="file" accept=".csv" ref={fileInputRef} onChange={processarArquivoCSV} className="hidden"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 px-10 rounded-2xl transition-all shadow-lg"
                >
                  Procurar Arquivo
                </button>
              </div>

              {listaLote.length > 0 && (
                <div className="bg-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-700">
                  <div className="text-center sm:text-left">
                    <h4 className="text-xl font-bold text-white">{listaLote.length} crachás prontos</h4>
                    <p className="text-slate-400 mt-1">Clique em imprimir para gerar as páginas A4 cortadas.</p>
                  </div>
                  <button onClick={imprimir} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-2xl transition-all shadow-lg">
                    🖨️ Imprimir Todos
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* --- ÁREA DE IMPRESSÃO --- */}
        <div className="hidden print:block bg-white text-black min-h-screen">
          <div className="grid grid-cols-2 gap-4 gap-y-8 p-4">
            {modo === 'individual' ? (
              <CartaoImpressao dados={{ nome, matricula, setor, empresa }} />
            ) : (
              listaLote.map((func, index) => (
                <CartaoImpressao key={index} dados={func} />
              ))
            )}
          </div>
        </div>
      </LayoutAdmin>
    </Protegido>
  )
}

/* COMPONENTES SECUNDÁRIOS PARA MANTER O CÓDIGO LIMPO */

// O cartão visual da tela escura (Pré-visualização)
function CartaoCracha({ dados }: { dados: DadosCracha }) {
  const jsonStr = JSON.stringify({
    nome: dados.nome.toUpperCase().trim(),
    matricula: dados.matricula.trim(),
    setor: dados.setor.toUpperCase().trim(),
    empresa: dados.empresa
  })

  return (
    <div className="w-64 bg-white text-black p-5 rounded-2xl shadow-2xl flex flex-col items-center border border-slate-200">
      <div className="bg-blue-600 text-white w-full py-2 text-center rounded-xl font-bold text-sm mb-4 shadow-sm">
        {dados.empresa || 'EMPRESA'}
      </div>
      <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl mb-3">
        {/* QR Code na pré-visualização reduzido para 110 */}
        <QRCodeSVG value={jsonStr} size={110} />
      </div>
      <p className="font-extrabold text-center text-sm uppercase text-slate-900 tracking-tight leading-snug px-1 w-full truncate">
        {dados.nome || 'NOME DO FUNCIONÁRIO'}
      </p>
      <div className="mt-3 pt-3 border-t border-slate-100 w-full text-center">
        <p className="text-[10px] text-slate-500 uppercase font-semibold">Matrícula</p>
        <p className="font-bold text-slate-800 text-base mt-0.5">{dados.matricula || '--'}</p>
      </div>
    </div>
  )
}

// O cartão oficial que vai pro papel na impressora
function CartaoImpressao({ dados }: { dados: DadosCracha }) {
  const jsonStr = JSON.stringify({
    nome: dados.nome.toUpperCase().trim(),
    matricula: dados.matricula.trim(),
    setor: dados.setor.toUpperCase().trim(),
    empresa: dados.empresa
  })

  return (
    // Tamanho padrão mantido 8.5 x 5.5 (CR80)
    <div className="w-[8.5cm] h-[5.5cm] bg-white text-black p-3 rounded-lg border border-dashed border-slate-300 flex items-center gap-4 break-inside-avoid">
      <div className="p-1 border border-slate-200 rounded-md shrink-0 bg-slate-50">
        {/* QR Code de impressão super reduzido (Tamanho 90) */}
        <QRCodeSVG value={jsonStr} size={90} />
      </div>
      <div className="flex-1 flex flex-col justify-between h-full py-1 overflow-hidden">
        <div>
          <span className="text-[10px] font-extrabold uppercase bg-blue-600 text-white px-2 py-0.5 rounded shadow-sm tracking-wide">
            {dados.empresa || 'EMP'}
          </span>
          <h3 className="font-black text-sm uppercase leading-tight text-slate-900 mt-2 line-clamp-2">
            {dados.nome}
          </h3>
          <p className="text-[10px] text-slate-500 uppercase font-semibold mt-1.5 truncate">
            {dados.setor || 'GERAL'}
          </p>
        </div>
        <div className="border-t pt-1 border-slate-200 mt-2">
          <p className="text-[9px] text-slate-500 uppercase font-bold">Matrícula</p>
          <p className="font-bold text-slate-900 text-sm mt-0.5">{dados.matricula}</p>
        </div>
      </div>
    </div>
  )
}