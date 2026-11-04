'use client'

import LayoutAdmin from '@/app/components/LayoutAdmin'
import Protegido from '@/app/components/Protegido'
import { useState, useEffect } from 'react'
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
  
  // Armazena o setor do usuário logado para carimbar no evento
  const [userSetor, setUserSetor] = useState<string | null>(null)
  const [carregandoPerfil, setCarregandoPerfil] = useState(true)

  // 🛡️ BLOQUEIO DE SEGURANÇA E CAPTURA DE SETOR NA ENTRADA DA TELA
  useEffect(() => {
    async function verificarPermissao() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Consulta a role e o setor do usuário na tabela 'perfis'
      const { data: perfil, error } = await supabase
        .from('perfis')
        .select('role, setor')
        .eq('id', user.id)
        .single()

      const role = (perfil?.role || '').toLowerCase().trim()

      if (error || !perfil || (!role.includes('admin') && role !== 'responsavel')) {
        alert('🚫 Acesso negado! Apenas administradores e responsáveis podem gerenciar eventos.')
        router.push('/eventos')
        return
      }

      // Salva o setor do usuário (ex: 'TI') para usar na hora de inserir o evento
      setUserSetor(perfil.setor || 'Geral')
      setCarregandoPerfil(false)
    }

    verificarPermissao()
  }, [router])

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
      case 'Ginástica Laboral':
        return 'LAB'
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

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      alert('Você precisa estar logado para criar um evento!')
      setSalvando(false)
      return
    }

    // 🔥 BUSCA O ÚLTIMO EVENTO DESTE TIPO NO SISTEMA INTEIRO (Global)
    const {
      data: ultimosEventos,
      error: erroBusca,
    } = await supabase
      .from('eventos')
      .select('codigo_evento')
      .eq('tipo', tipo)
      .order('created_at', { ascending: false })
      .limit(1)

    if (erroBusca) {
      console.log(erroBusca)
      setSalvando(false)
      alert('Erro ao gerar código do evento')
      return
    }

    let proximoNumero = 1

    if (ultimosEventos && ultimosEventos.length > 0 && ultimosEventos[0].codigo_evento) {
      const partes = ultimosEventos[0].codigo_evento.split('-')
      const ultimoNumero = parseInt(partes[1])
      
      if (!isNaN(ultimoNumero)) {
        proximoNumero = ultimoNumero + 1
      }
    }

    const prefixo = gerarPrefixo(tipo)
    const codigoEvento = `${prefixo}-${String(proximoNumero).padStart(3, '0')}`
    const codigo = crypto.randomUUID()

    // INSERT COM O ID DO USUÁRIO E O SETOR
    const { error } = await supabase
      .from('eventos')
      .insert([
        {
          usuario_id: user.id,
          setor: userSetor, // Carimba o evento com o setor do criador (ex: 'TI')
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
      alert('Erro ao criar evento. Verifique suas permissões no banco.')
      return
    }

    alert(`Evento criado com sucesso para o setor ${userSetor}: ${codigoEvento}`)
    router.push('/eventos')
  }

  if (carregandoPerfil) {
    return (
      <div className="p-10 text-white min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-xl font-semibold">Verificando credenciais corporativas...</p>
          <p className="text-sm text-slate-400">Aguarde validação de segurança.</p>
        </div>
      </div>
    )
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
              Cadastro de evento para o setor: <span className="text-blue-400 font-semibold">{userSetor}</span>
            </p>
          </div>

          {/* CARD */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-5">
            <Campo
              titulo="Título"
              value={titulo}
              onChange={(e: any) => setTitulo(e.target.value)}
            />

            <div>
              <label className="block mb-2 text-sm text-slate-300">
                Tipo do Evento
              </label>

              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white outline-none"
              >
                <option value="DDS">DDS</option>
                <option value="DDQ">DDQ</option>
                <option value="Treinamento">Treinamento</option>
                <option value="Reunião">Reunião</option>
                <option value="Integração">Integração</option>
                <option value="Gestão de Mudança">Gestão de Mudança</option>
                <option value="Ginástica Laboral">Ginástica Laboral</option>
              </select>
            </div>

            <Campo
              titulo="Data"
              type="date"
              value={data}
              onChange={(e: any) => setData(e.target.value)}
            />

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

            <Campo
              titulo="Responsável"
              value={instrutor}
              onChange={(e: any) => setInstrutor(e.target.value)}
            />

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

            <button
              onClick={criarEvento}
              disabled={salvando}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all py-4 rounded-2xl text-lg font-bold text-white"
            >
              {salvando ? 'Criando...' : 'Criar Evento'}
            </button>
          </div>
        </div>
      </LayoutAdmin>
    </Protegido>
  )
}

function Campo({ titulo, ...props }: any) {
  return (
    <div>
      <label className="block mb-2 text-sm text-slate-300">
        {titulo}
      </label>
      <input
        {...props}
        className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white outline-none focus:border-blue-500 transition-all"
      />
    </div>
  )
}