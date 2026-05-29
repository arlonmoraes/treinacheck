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

          {/* INSTRUÇÃO UNITÁRIA E DIRETA */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-10 shadow-xl flex flex-col md:flex-row items-center gap-8 hover:border-slate-700 transition-all">
            <div className="w-24 h-24 bg-blue-500/20 text-blue-400 rounded-3xl flex items-center justify-center text-5xl shrink-0 shadow-inner">
              📲
            </div>
            
            <div>
              <h2 className="text-3xl font-bold text-white mb-3">
                Registro de Presença Simples
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed">
                Para registrar a presença da equipe, basta abrir um evento e pedir para os participantes <strong>escanearem o QR Code</strong> com a câmera do próprio celular. O check-in cai no sistema na mesma hora, sem complicação!
              </p>
            </div>
          </div>

        </div>
      </LayoutAdmin>
    </Protegido>
  )
}