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

  async function buscarEventoAtual(): Promise<Evento | null> {
    if (!evento?.id || !navigator.onLine) return null

    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .eq('id', evento.id)
      .single()

    if (error || !data) {
      console.error('Não foi possível consultar o evento atualizado:', error)
      return null
    }

    setEvento(data as Evento)
    return data as Evento
  }

  function eventoEstaNoPeriodo(ev: Evento): boolean {
    const agora = new Date()
    const inicio = new Date(`${ev.data}T${ev.hora_inicio}`)
    const fim = new Date(`${ev.data}T${ev.hora_fim}`)
    return !Number.isNaN(inicio.getTime()) &&
      !Number.isNaN(fim.getTime()) &&
      agora >= inicio &&
      agora <= fim
  }

  function mostrarBloqueioEvento(ev: Evento | null) {
    const status = ev?.status || 'indisponível'
    setSalvando(false)
    setMensagem('')
    alert(
      `Presença bloqueada. O evento precisa estar ABERTO e dentro do horário permitido. Status atual: ${status}.`
    )
  }

  async function registrarPresenca() {
    if (!evento || salvando) return

    if (!nome.trim() || !setor.trim() || !empresa) {
      alert('Preencha todos os campos')
      return
    }

    if (empresa === 'Outros' && !empresaOutra.trim()) {
      alert('Digite a empresa')
      return
    }

    if (evento.exigir_selfie && !foto) {
      alert('Selfie obrigatória')
      return
    }

    // Nunca confia no status guardado no estado da página: consulta o banco.
    setSalvando(true)
    setMensagem('Verificando se o evento está aberto...')

    try {
      const eventoAtual = await buscarEventoAtual()

      if (
        !eventoAtual ||
        String(eventoAtual.status || '').trim().toUpperCase() !== 'ABERTO' ||
        !eventoEstaNoPeriodo(eventoAtual)
      ) {
        mostrarBloqueioEvento(eventoAtual)
        return
      }

      setMensagem('Verificando funcionário...')

      const nomeDigitado = nome.trim()
      const palavras = nomeDigitado.split(/\s+/)
      let query = supabase.from('funcionarios').select('*')

      palavras.forEach((palavra) => {
        query = query.ilike('nome', `%${palavra}%`)
      })

      const { data: correspondentes, error: erroFuncionarios } = await query

      if (erroFuncionarios) {
        console.error('Erro ao consultar funcionário:', erroFuncionarios)
        setSalvando(false)
        setMensagem('')
        alert('Não foi possível consultar o funcionário. Tente novamente.')
        return
      }

      let idParaSalvar: string | null = null
      let matriculaParaSalvar: string | null = null
      let nomeParaSalvar = nomeDigitado

      if (correspondentes && correspondentes.length > 1) {
        if (!funcionarioIdCorreto) {
          setHomonimos(correspondentes)
          setSalvando(false)
          setMensagem('')
          return
        }

        const escolhido = correspondentes.find(
          (f: any) => f.id === funcionarioIdCorreto
        )

        if (!escolhido) {
          setSalvando(false)
          setMensagem('')
          alert('Selecione um funcionário válido.')
          return
        }

        idParaSalvar = escolhido.id
        matriculaParaSalvar = escolhido.matricula
        nomeParaSalvar = escolhido.nome
      } else if (correspondentes && correspondentes.length === 1) {
        idParaSalvar = correspondentes[0].id
        matriculaParaSalvar = correspondentes[0].matricula
        nomeParaSalvar = correspondentes[0].nome
      }

      setMensagem('Validando localização...')

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const latitudeUsuario = pos.coords.latitude
            const longitudeUsuario = pos.coords.longitude

            // O evento pode ter sido fechado enquanto o GPS era consultado.
            const eventoAntesDoUpload = await buscarEventoAtual()

            if (
              !eventoAntesDoUpload ||
              String(eventoAntesDoUpload.status || '').trim().toUpperCase() !== 'ABERTO' ||
              !eventoEstaNoPeriodo(eventoAntesDoUpload)
            ) {
              mostrarBloqueioEvento(eventoAntesDoUpload)
              return
            }

            if (
              eventoAntesDoUpload.latitude != null &&
              eventoAntesDoUpload.longitude != null
            ) {
              const distancia = calcularDistancia(
                latitudeUsuario,
                longitudeUsuario,
                eventoAntesDoUpload.latitude,
                eventoAntesDoUpload.longitude
              )

              if (distancia > 0.01) {
                setSalvando(false)
                setMensagem('')
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
                console.error(erroUpload)
                setSalvando(false)
                setMensagem('')
                alert('Erro ao enviar selfie')
                return
              }

              const {
                data: { publicUrl },
              } = supabase.storage.from('selfies').getPublicUrl(nomeArquivo)

              fotoUrl = publicUrl
            }

            setMensagem('Confirmando status e registrando presença...')

            // Última consulta imediatamente antes do INSERT.
            const eventoFinal = await buscarEventoAtual()

            if (
              !eventoFinal ||
              String(eventoFinal.status || '').trim().toUpperCase() !== 'ABERTO' ||
              !eventoEstaNoPeriodo(eventoFinal)
            ) {
              mostrarBloqueioEvento(eventoFinal)
              return
            }

            const agoraBrasil = new Date(
              new Date().toLocaleString('en-US', {
                timeZone: 'America/Sao_Paulo',
              })
            )

            const { error } = await supabase.from('presencas').insert([
              {
                evento_id: eventoFinal.id,
                funcionario_id: idParaSalvar || null,
                nome: nomeParaSalvar,
                matricula: matriculaParaSalvar || null,
                setor: setor.trim(),
                empresa: empresa === 'Outros' ? empresaOutra.trim() : empresa,
                foto_url: fotoUrl || null,
                data_hora: agoraBrasil.toISOString(),
              },
            ])

            if (error) {
              console.error('Erro ao inserir presença:', error)
              setSalvando(false)
              setMensagem('')
              alert('Erro ao registrar presença')
              return
            }

            setSalvando(false)
            alert(`Presença registrada com sucesso para ${nomeParaSalvar}!`)

            setNome('')
            setSetor('')
            setEmpresa('')
            setEmpresaOutra('')
            setFoto(null)
            setMensagem('')
            setHomonimos([])
            setFuncionarioIdCorreto('')
          } catch (erro) {
            console.error('Erro durante o registro:', erro)
            setSalvando(false)
            setMensagem('')
            alert('Não foi possível validar o evento e registrar a presença. Tente novamente.')
          }
        },
        () => {
          setSalvando(false)
          setMensagem('')
          alert('Permita acesso à localização')
        }
      )
    } catch (erro) {
      console.error('Erro ao validar evento:', erro)
      setSalvando(false)
      setMensagem('')
      alert('Não foi possível confirmar o status do evento. A presença não foi registrada.')
    }
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

          {/* CAIXA DE SELEÇÃO DE HOMÔNIMOS */}
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
            className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white outline-none"
          >
            <option value="">Selecione a empresa</option>
            <option>BBA</option>
            <option>BEC</option>
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
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all py-4 rounded-2xl text-lg font-bold shadow-2xl cursor-pointer"
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
      className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 outline-none focus:border-blue-500 transition-all text-white"
    />
  )
}