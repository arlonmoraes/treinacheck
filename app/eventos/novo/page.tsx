'use client'

import LayoutAdmin from '@/app/components/LayoutAdmin'
import Protegido from '@/app/components/Protegido'
import { useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'

export default function NovoEvento() {
  const router = useRouter()

  const [titulo, setTitulo] = useState('')
  const [tipo, setTipo] = useState('DDS')
  const [data, setData] = useState('')
  const [horaInicio, setHoraInicio] = useState('')
  const [horaFim, setHoraFim] = useState('')
  const [instrutor, setInstrutor] = useState('')
  const [exigirSelfie, setExigirSelfie] = useState(true)
  const [salvando, setSalvando] = useState(false)

  // PREFIXOS DOS EVENTOS
  function gerarPrefixo(tipo: string) {
    switch (tipo) {
      case 'DDS':
        return 'DDS'
      case 'DDQ':
        return 'DDQ'
      case 'Treinamento':
        return 'TRE'
      case 'Reunião':
        return 'REU'
      case 'Integração':
        return 'INT'
      case 'Gestão de Mudança':
        return 'GDM'
      default:
        return 'EVT'
    }
  }

  async function criarEvento() {
    if (
      !titulo ||
      !tipo ||
      !data ||
      !horaInicio ||
      !horaFim ||
      !instrutor
    ) {
      alert('Preencha todos os campos')
      return
    }

    setSalvando(true)

    // 1. DESCOBRE QUEM ESTÁ LOGADO
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      alert('Você precisa estar logado para criar um evento!')
      setSalvando(false)
      return
    }

    // 2. BUSCA EVENTOS DO MESMO TIPO CRIADOS POR ESTE USUÁRIO
    const {
      data: eventosTipo,
      error: erroBusca,
    } = await supabase
      .from('eventos')
      .select('id')
      .eq('tipo', tipo)
      .eq('usuario_id', user.id) // Garante que a numeração seja individual por conta

    if (erroBusca) {
      console.log(erroBusca)
      setSalvando(false)
      alert('Erro ao gerar código do evento')
      return
    }

    // NUMERO SEQUENCIAL
    const numero = (eventosTipo?.length || 0) + 1

    // PREFIXO
    const prefixo = gerarPrefixo(tipo)

    // CODIGO FINAL
    const codigoEvento = `${prefixo}-${String(numero).padStart(3, '0')}`

    // CODIGO QR RANDOM
    const codigo = crypto.randomUUID()

    // 3. INSERT COM O ID DO USUÁRIO
    const { error } = await supabase
      .from('eventos')
      .insert([
        {
          usuario_id: user.id, // VINCULA O EVENTO AO USUÁRIO
          titulo,
          tipo,
          codigo_evento: codigoEvento,
          data,
          hora_inicio: horaInicio,
          hora_fim: horaFim,
          instrutor,
          codigo,
          status: 'Aberto',
          exigir_selfie: exigirSelfie,
        },
      ])

    setSalvando(false)

    if (error) {
      console.log(error)
      alert('Erro ao criar evento')
      return
    }

    alert(`Evento criado: ${codigoEvento}`)
    router.push('/eventos')
  }

  return (
    <Protegido>
      <LayoutAdmin>
        <div className="max-w-3xl mx-auto">
          {/* HEADER */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white">
              ➕ Novo Evento
            </h1>

            <p className="text-slate-400 mt-2">
              Cadastro de evento
            </p>
          </div>

          {/* CARD */}
          <div
            className="
              bg-slate-900
              border
              border-slate-800
              rounded-3xl
              p-8
              space-y-5
            "
          >
            {/* TITULO */}
            <Campo
              titulo="Título"
              value={titulo}
              onChange={(e: any) => setTitulo(e.target.value)}
            />

            {/* TIPO */}
            <div>
              <label className="block mb-2 text-sm text-slate-300">
                Tipo do Evento
              </label>

              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="
                  w-full
                  bg-slate-800
                  border
                  border-slate-700
                  rounded-2xl
                  p-4
                  text-white
                "
              >
                <option value="DDS">DDS</option>
                <option value="DDQ">DDQ</option>
                <option value="Treinamento">Treinamento</option>
                <option value="Reunião">Reunião</option>
                <option value="Integração">Integração</option>
                <option value="Gestão de Mudança">Gestão de Mudança</option>
              </select>
            </div>

            {/* DATA */}
            <Campo
              titulo="Data"
              type="date"
              value={data}
              onChange={(e: any) => setData(e.target.value)}
            />

            {/* HORARIOS */}
            <div className="grid grid-cols-2 gap-4">
              <Campo
                titulo="Hora início"
                type="time"
                value={horaInicio}
                onChange={(e: any) => setHoraInicio(e.target.value)}
              />

              <Campo
                titulo="Hora fim"
                type="time"
                value={horaFim}
                onChange={(e: any) => setHoraFim(e.target.value)}
              />
            </div>

            {/* RESPONSAVEL */}
            <Campo
              titulo="Responsável"
              value={instrutor}
              onChange={(e: any) => setInstrutor(e.target.value)}
            />

            {/* SELFIE */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={exigirSelfie}
                onChange={(e) => setExigirSelfie(e.target.checked)}
              />

              <span className="text-white">
                Exigir selfie
              </span>
            </div>

            {/* BOTAO */}
            <button
              onClick={criarEvento}
              disabled={salvando}
              className="
                w-full
                bg-blue-600
                hover:bg-blue-700
                disabled:opacity-50
                transition-all
                py-4
                rounded-2xl
                text-lg
                font-bold
                text-white
              "
            >
              {salvando ? 'Criando...' : 'Criar Evento'}
            </button>
          </div>
        </div>
      </LayoutAdmin>
    </Protegido>
  )
}

/* CAMPO */
function Campo({ titulo, ...props }: any) {
  return (
    <div>
      <label className="block mb-2 text-sm text-slate-300">
        {titulo}
      </label>

      <input
        {...props}
        className="
          w-full
          bg-slate-800
          border
          border-slate-700
          rounded-2xl
          p-4
          text-white
          outline-none
          focus:border-blue-500
        "
      />
    </div>
  )
}