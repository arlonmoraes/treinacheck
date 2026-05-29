'use client'

import LayoutAdmin from '@/app/components/LayoutAdmin'
import Protegido from '@/app/components/Protegido'
import Link from 'next/link'

export default function Home() {
  return (
    <Protegido>
      <LayoutAdmin>
        <div className="space-y-8 max-w-6xl mx-auto">
          
          {/* BANNER DE BOAS-VINDAS */}
          <div className="bg-gradient-to-r from-blue-900 to-slate-900 border border-blue-800/50 rounded-[32px] p-10 shadow-2xl relative overflow-hidden">
            {/* Efeito de brilho no fundo */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-3xl rounded-full"></div>
            
            <div className="relative z-10">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Bem-vindo ao <span className="text-blue-400">Minha Lista</span> 👋
              </h1>
              <p className="text-slate-300 text-lg max-w-2xl">
                O seu sistema de presença digital. Gerencie eventos, acompanhe check-ins em tempo real e gere relatórios com poucos cliques.
              </p>

              {/* ATALHOS RÁPIDOS */}
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/eventos/novo">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg flex items-center gap-2">
                    ➕ Criar Novo Evento
                  </button>
                </Link>
                <Link href="/eventos">
                  <button className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-2xl font-bold transition-all border border-slate-700 flex items-center gap-2">
                    📅 Ver Eventos
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* PASSO A PASSO RÁPIDO */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Como registrar presenças?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* PASSO 1 */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl hover:border-slate-700 transition-all flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center text-3xl mb-5">
                  📅
                </div>
                <h3 className="text-xl font-bold text-white mb-2">1. Abra o Evento</h3>
                <p className="text-slate-400">
                  Crie um evento novo ou abra um já existente na sua lista.
                </p>
              </div>

              {/* PASSO 2 */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl hover:border-slate-700 transition-all flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-2xl flex items-center justify-center text-3xl mb-5">
                  📲
                </div>
                <h3 className="text-xl font-bold text-white mb-2">2. Escaneie o QR Code</h3>
                <p className="text-slate-400">
                  Aponte a câmera do celular para o QR Code que aparece na tela.
                </p>
              </div>

              {/* PASSO 3 */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl hover:border-slate-700 transition-all flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center text-3xl mb-5">
                  ✅
                </div>
                <h3 className="text-xl font-bold text-white mb-2">3. Presença Confirmada</h3>
                <p className="text-slate-400">
                  Preencha os dados no celular e a presença é registrada na hora!
                </p>
              </div>

            </div>
          </div>

        </div>
      </LayoutAdmin>
    </Protegido>
  )
}