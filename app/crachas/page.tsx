'use client'

import LayoutAdmin from '@/app/components/LayoutAdmin'
import Protegido from '@/app/components/Protegido'
import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

export default function GeradorCrachas() {
  const [nome, setNome] = useState('')
  const [matricula, setMatricula] = useState('')
  const [setor, setSetor] = useState('')
  const [centroCusto, setCentroCusto] = useState('')
  const [empresa, setEmpresa] = useState('JAC')

  // Gera a string exata do JSON esperado pela câmera
  const stringJsonCracha = JSON.stringify({
    nome: nome.toUpperCase().trim(),
    matricula: matricula.trim(),
    setor: setor.toUpperCase().trim(),
    centro_custo: centroCusto.toUpperCase().trim(),
    empresa: empresa
  })

  function limparFormulario() {
    setNome('')
    setMatricula('')
    setSetor('')
    setCentroCusto('')
  }

  function imprimirCracha() {
    window.print()
  }

  return (
    <Protegido>
      <LayoutAdmin>
        <div className="space-y-8 p-2 sm:p-0 print:hidden">
          <div>
            <h1 className="text-4xl font-bold text-white">🏷️ Gerador de Crachás</h1>
            <p className="text-slate-400 mt-2">Crie o QR Code de identificação para impressão rápida</p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* FORMULÁRIO */}
            <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
              <h2 className="text-xl font-bold text-white mb-2">📋 Dados do Funcionário</h2>
              
              <div>
                <label className="text-sm text-slate-400 block mb-2">Nome Completo</label>
                <input 
                  type="text" value={nome} onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: CARLOS HENRIQUE DE ALMEIDA"
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 outline-none text-white focus:border-blue-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Matrícula</label>
                  <input 
                    type="text" value={matricula} onChange={(e) => setMatricula(e.target.value)}
                    placeholder="Ex: 765"
                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 outline-none text-white focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-400 block mb-2">Empresa</label>
                  <select 
                    value={empresa} onChange={(e) => setEmpresa(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 outline-none text-white focus:border-blue-500 transition-all"
                  >
                    <option value="JAC">JAC</option>
                    <option value="BEC">BEC</option>
                    <option value="BBA">BBA</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Setor/Área</label>
                  <input 
                    type="text" value={setor} onChange={(e) => setSetor(e.target.value)}
                    placeholder="Ex: PRODUCAO DE BILIS"
                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 outline-none text-white focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-400 block mb-2">Centro de Custo</label>
                  <input 
                    type="text" value={centroCusto} onChange={(e) => setCentroCusto(e.target.value)}
                    placeholder="Ex: 5001-A"
                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 outline-none text-white focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={imprimirCracha}
                  disabled={!nome || !matricula}
                  className="flex-1 bg-blue-600 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-4 rounded-2xl shadow-lg transition-all"
                >
                  🖨️ Imprimir Crachá
                </button>
                <button 
                  onClick={limparFormulario}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-6 rounded-2xl transition-all"
                >
                  Limpar
                </button>
              </div>
            </div>

            {/* PRÉ-VISUALIZAÇÃO DENTRO DO SISTEMA */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-center">
              <h2 className="text-xl font-bold text-white mb-6">👁️ Pré-visualização</h2>
              
              {/* Modelo Cartão */}
              <div className="w-64 bg-white text-black p-4 rounded-2xl shadow-2xl flex flex-col items-center border border-slate-200">
                <div className="bg-blue-600 text-white w-full py-2 text-center rounded-xl font-bold text-sm mb-4">
                  {empresa || 'EMPRESA'}
                </div>
                <div className="p-2 bg-slate-50 rounded-xl mb-3">
                  <QRCodeSVG value={stringJsonCracha} size={140} />
                </div>
                <p className="font-extrabold text-center text-sm uppercase text-slate-900 tracking-tight leading-tight px-1 max-w-full truncate">
                  {nome || 'Nome do Funcionário'}
                </p>
                <div className="grid grid-cols-2 gap-x-2 text-[10px] text-slate-500 mt-3 w-full border-t pt-2 border-slate-100">
                  <p>Matrícula: <span className="font-bold text-slate-800 block truncate">{matricula || '--'}</span></p>
                  <p>CC: <span className="font-bold text-slate-800 block truncate">{centroCusto || '--'}</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ESTRUTURA EXCLUSIVA PARA IMPRESSORA (Esconde todo o site e imprime só o cartão limpo) */}
        <div className="hidden print:flex fixed inset-0 bg-white text-black items-center justify-center z-50">
          <div className="w-[8.5cm] h-[5.5cm] bg-white text-black p-4 rounded-lg border-2 border-slate-300 flex items-center gap-4 shadow-none">
            <div className="p-1 border border-slate-200 rounded-md">
              <QRCodeSVG value={stringJsonCracha} size={130} />
            </div>
            <div className="flex-1 flex flex-col justify-between h-full py-1">
              <div>
                <span className="text-[10px] font-extrabold uppercase bg-blue-600 text-white px-2 py-0.5 rounded-sm tracking-wide">
                  {empresa}
                </span>
                <h3 className="font-black text-xs uppercase leading-tight text-slate-900 mt-2 line-clamp-2">
                  {nome}
                </h3>
                <p className="text-[9px] text-slate-500 uppercase font-semibold mt-1 truncate">
                  {setor || 'Geral'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-1 border-t pt-1.5 border-slate-200 text-[9px] text-slate-600">
                <div>MATRÍCULA:<span className="font-bold text-slate-900 block">{matricula}</span></div>
                <div>C. CUSTO:<span className="font-bold text-slate-900 block">{centroCusto || '--'}</span></div>
              </div>
            </div>
          </div>
        </div>

      </LayoutAdmin>
    </Protegido>
  )
}