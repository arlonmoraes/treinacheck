'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useParams } from 'next/navigation'

function calcularDistancia(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371

  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

type Evento = {
  id: string
  titulo: string
  tipo: string
  data: string
  instrutor: string
  codigo: string
  status: string
  hora_inicio: string
  hora_fim: string
  latitude: number | null
  longitude: number | null
  exigir_selfie: boolean
}

export default function RegistrarPresenca() {
  const params = useParams()
  const codigo = params?.codigo?.toString()

  const [evento, setEvento] = useState<Evento | null>(null)
  const [nome, setNome] = useState('')
  const [setor, setSetor] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [empresaOutra, setEmpresaOutra] = useState('')
  const [foto, setFoto] = useState<File | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')

  const [homonimos, setHomonimos] = useState<any[]>([])
  const [funcionarioIdCorreto, setFuncionarioIdCorreto] = useState('')

  useEffect(() => {
    if (!codigo) return
    buscarEvento()
  }, [codigo])

  async function buscarEvento() {
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .eq('codigo', String(codigo).trim())
      .single()

    if (error) {
      console.log(error)
      alert('Evento não encontrado')
      return
    }

    setEvento(data)
  }

  async function registrarPresenca() {
    if (!evento) return

    if (evento.status === 'Encerrado') {
      alert('Evento encerrado')
      return
    }

    if (!nome || !setor || !empresa) {
      alert('Preencha todos os campos')
      return
    }

    if (empresa === 'Outros' && !empresaOutra) {
      alert('Digite a empresa')
      return
    }

    if (evento.exigir_selfie && !foto) {
      alert('Selfie obrigatória')
      return
    }

    const agora = new Date()
    const inicio = new Date(`${evento.data}T${evento.hora_inicio}`)
    const fim = new Date(`${evento.data}T${evento.hora_fim}`)

    if (agora < inicio || agora > fim) {
      alert('Fora do horário permitido')
      return
    }

    setSalvando(true)
    setMensagem('Buscando funcionário...')

    const nomeDigitado = nome.trim()

    // 1. BUSCA POR APROXIMAÇÃO NO SUPABASE (.ilike)
    // O '%texto%' significa que vai buscar o termo em qualquer parte do nome ignorando maiúsculas/minúsculas
    const { data: correspondentes, error: erroBusca } = await supabase
      .from('funcionarios')
      .select('*')
      .ilike('nome', `%${nomeDigitado}%`)

    if (erroBusca || !correspondentes || correspondentes.length === 0) {
      setSalvando(false)
      setMensagem('')
      alert('Funcionário não encontrado com este nome. Digite novamente.')
      return
    }

    let idParaSalvar = null
    let matriculaParaSalvar = null
    let nomeParaSalvar = nome.trim() // Padrão se nada for achado, mas vamos atualizar abaixo

    // SE ACHOU MAIS DE UM NOME QUE COMBINA (Ex: digitou "Arlo" e achou "Arlon" e "Carlos")
    if (correspondentes.length > 1) {
      if (!funcionarioIdCorreto) {
        setHomonimos(correspondentes)
        setSalvando(false)
        setMensagem('')
        return // Pausa para o usuário selecionar na lista suspensa
      } else {
        const escolhido = correspondentes.find(
          (f: any) => f.id === funcionarioIdCorreto
        )
        if (escolhido) {
          idParaSalvar = escolhido.id
          matriculaParaSalvar = escolhido.matricula
          nomeParaSalvar = escolhido.nome // Grava o nome certinho do banco (ex: "Arlon")
        }
      }
    } else if (correspondentes.length === 1) {
      // Se achou exatamente 1 pessoa por aproximação, puxa os dados dela automaticamente
      idParaSalvar = correspondentes[0].id
      matriculaParaSalvar = correspondentes[0].matricula
      nomeParaSalvar = correspondentes[0].nome // Corrige o nome automaticamente (ex: de "Arlo" para "Arlon")
    }

    setMensagem('Validando localização...')

    // 2. VALIDAÇÃO DE GPS E UPLOAD DE FOTO
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latitudeUsuario = pos.coords.latitude
        const longitudeUsuario = pos.coords.longitude

        if (evento.latitude && evento.longitude) {
          const distancia = calcularDistancia(
            latitudeUsuario,
            longitudeUsuario,
            evento.latitude,
            evento.longitude
          )

          if (distancia > 0.01) {
            setSalvando(false)
            alert('Você não está no local do evento')
            return
          }
        }

        let fotoUrl = ''

        if (foto) {
          setMensagem('Enviando selfie...')

          const nomeArquivo = `${Date.now()}-${foto.name}`

          const { error: erroUpload } = await supabase.storage
            .from('selfies')
            .upload(nomeArquivo, foto)

          if (erroUpload) {
            console.log(erroUpload)
            setSalvando(false)
            alert('Erro ao enviar selfie')
            return
          }

          const {
            data: { publicUrl },
          } = supabase.storage.from('selfies').getPublicUrl(nomeArquivo)

          fotoUrl = publicUrl
        }

        setMensagem('Registrando presença...')

        /* HORÁRIO BRASIL */
        const agoraBrasil = new Date(
          new Date().toLocaleString('en-US', {
            timeZone: 'America/Sao_Paulo',
          })
        )

        const { error } = await supabase.from('presencas').insert([
          {
            evento_id: evento.id,
            funcionario_id: idParaSalvar || null,
            nome: nomeParaSalvar, // Salva o nome correto obtido do banco de dados
            matricula: matriculaParaSalvar || null,
            setor: setor.trim(),
            empresa: empresa === 'Outros' ? empresaOutra.trim() : empresa,
            foto_url: fotoUrl || null,
            data_hora: agoraBrasil.toISOString(),
          },
        ])

        setSalvando(false)

        if (error) {
          console.log(error)
          alert('Erro ao registrar presença')
          return
        }

        alert(`Presença registrada com sucesso para ${nomeParaSalvar}!`)

        setNome('')
        setSetor('')
        setEmpresa('')
        setEmpresaOutra('')
        setFoto(null)
        setMensagem('')
        setHomonimos([])
        setFuncionarioIdCorreto('')
      },
      () => {
        setSalvando(false)
        alert('Permita acesso à localização')
      }
    )
  }

  if (!evento) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Carregando evento...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex justify-center items-center p-5">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-[32px] shadow-2xl p-8">
        {/* LOGO */}
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="Logo" className="h-20 object-contain" />
        </div>

        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold">📲 Check-in</h1>
          <p className="text-slate-400 mt-2">Registro de presença</p>
        </div>

        {/* EVENTO */}
        <div className="bg-slate-800 rounded-3xl p-6 space-y-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold">{evento.titulo}</h2>
            <p className="text-slate-400">{evento.tipo}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Info titulo="📅 Data" valor={evento.data} />
            <Info titulo="👨‍🏫 Responsável" valor={evento.instrutor} />
            <Info
              titulo="🕒 Horário"
              valor={`${evento.hora_inicio} - ${evento.hora_fim}`}
            />
            <Info
              titulo="📸 Selfie"
              valor={evento.exigir_selfie ? 'Obrigatória' : 'Opcional'}
            />
          </div>
        </div>

        {/* FORM */}
        <div className="space-y-5">
          <Campo
            placeholder="Nome completo (ou parte dele)"
            value={nome}
            onChange={(e: any) => {
              setNome(e.target.value)
              setHomonimos([])
              setFuncionarioIdCorreto('')
            }}
          />

          {/* CAIXA DE SELEÇÃO DE HOMÔNIMOS / APROXIMAÇÃO */}
          {homonimos.length > 1 && (
            <div className="bg-orange-500/10 border border-orange-500/50 rounded-2xl p-5 shadow-inner">
              <label className="block mb-3 font-semibold text-orange-400">
                🔍 Encontramos mais de um resultado para sua busca. Selecione quem é você:
              </label>
              <select
                value={funcionarioIdCorreto}
                onChange={(e) => setFuncionarioIdCorreto(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 outline-none focus:border-orange-500 transition-all text-white"
              >
                <option value="">Selecione seu nome correto...</option>
                {homonimos.map((h: any) => (
                  <option key={h.id} value={h.id}>
                    {h.nome} - {h.setor} (Matrícula: {h.matricula || 'N/A'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <Campo
            placeholder="Setor"
            value={setor}
            onChange={(e: any) => setSetor(e.target.value)}
          />

          {/* EMPRESA */}
          <select
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4"
          >
            <option value="">Selecione a empresa</option>
            <option>BBA</option>
            <option>SUMA</option>
            <option>Outros</option>
          </select>

          {/* OUTROS */}
          {empresa === 'Outros' && (
            <Campo
              placeholder="Digite a empresa"
              value={empresaOutra}
              onChange={(e: any) => setEmpresaOutra(e.target.value)}
            />
          )}

          {/* SELFIE */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
            <label className="block mb-3 font-semibold">📸 Selfie</label>
            <input
              type="file"
              accept="image/*"
              capture="user"
              onChange={(e: any) => setFoto(e.target.files[0])}
            />
            {foto && (
              <p className="text-green-400 mt-3 text-sm">✅ Foto selecionada</p>
            )}
          </div>

          {/* LOADING */}
          {mensagem && (
            <div className="bg-blue-500/20 text-blue-300 p-4 rounded-2xl text-center">
              {mensagem}
            </div>
          )}

          {/* BOTÃO */}
          <button
            onClick={registrarPresenca}
            disabled={salvando}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all py-4 rounded-2xl text-lg font-bold shadow-2xl"
          >
            {salvando ? 'Processando...' : 'Confirmar presença'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* INFO */
function Info({ titulo, valor }: any) {
  return (
    <div className="bg-slate-900 p-4 rounded-2xl">
      <p className="text-slate-400 text-sm">{titulo}</p>
      <strong>{valor}</strong>
    </div>
  )
}

/* CAMPO */
function Campo(props: any) {
  return (
    <input
      {...props}
      className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 outline-none focus:border-blue-500 transition-all"
    />
  )
}