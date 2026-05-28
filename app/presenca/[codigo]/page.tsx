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

  const c =
    2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

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
  const [foto, setFoto] = useState<File | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')

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

    if (!nome || !setor) {
      alert('Preencha todos os campos')
      return
    }

    if (evento.exigir_selfie && !foto) {
      alert('Selfie obrigatória')
      return
    }

    const agora = new Date()

    const inicio = new Date(
      `${evento.data}T${evento.hora_inicio}`
    )

    const fim = new Date(
      `${evento.data}T${evento.hora_fim}`
    )

    if (agora < inicio || agora > fim) {
      alert('Fora do horário permitido')
      return
    }

    setSalvando(true)
    setMensagem('Validando localização...')

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

        setMensagem('Buscando funcionário...')

        // 🔥 CORREÇÃO PRINCIPAL AQUI
        const { data: funcionario, error: erroFuncionario } =
          await supabase
            .from('funcionarios')
            .select('*')
            .eq('nome', nome.trim())
            .maybeSingle()

        if (erroFuncionario || !funcionario) {
          setSalvando(false)
          alert('Funcionário não encontrado')
          return
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

          const { data: publicData } = supabase.storage
            .from('selfies')
            .getPublicUrl(nomeArquivo)

          fotoUrl = publicData.publicUrl
        }

        setMensagem('Registrando presença...')

        // 🔥 DATA SEGURA (UTC padrão)
        const agoraISO = new Date().toISOString()

        const { error } = await supabase.from('presencas').insert([
          {
            evento_id: evento.id,
            nome: funcionario.nome,
            matricula: funcionario.matricula,

            // 🔥 GARANTIA QUE NÃO SOME
            empresa: funcionario.empresa || 'NÃO INFORMADA',

            setor,
            foto_url: fotoUrl,
            data_hora: agoraISO,
          },
        ])

        setSalvando(false)

        if (error) {
          console.log(error)
          alert('Erro ao registrar presença')
          return
        }

        alert('Presença registrada com sucesso!')

        setNome('')
        setSetor('')
        setFoto(null)
        setMensagem('')
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

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold">📲 Check-in</h1>
          <p className="text-slate-400 mt-2">Registro de presença</p>
        </div>

        {/* EVENTO */}
        <div className="bg-slate-800 rounded-3xl p-6 mb-8">
          <h2 className="text-2xl font-bold">{evento.titulo}</h2>
          <p className="text-slate-400">{evento.tipo}</p>

          <div className="mt-4 text-sm text-slate-300">
            Empresa será preenchida automaticamente
          </div>
        </div>

        {/* FORM */}
        <div className="space-y-5">

          <Campo
            placeholder="Nome completo"
            value={nome}
            onChange={(e: any) =>
              setNome(e.target.value.toUpperCase())
            }
          />

          <Campo
            placeholder="Setor"
            value={setor}
            onChange={(e: any) => setSetor(e.target.value)}
          />

          {/* SELFIE */}
          <div className="bg-slate-800 p-5 rounded-2xl">
            <label className="block mb-3 font-semibold">
              📸 Selfie
            </label>

            <input
              type="file"
              accept="image/*"
              capture="user"
              onChange={(e: any) =>
                setFoto(e.target.files[0])
              }
            />
          </div>

          {mensagem && (
            <div className="bg-blue-500/20 text-blue-300 p-4 rounded-2xl text-center">
              {mensagem}
            </div>
          )}

          <button
            onClick={registrarPresenca}
            disabled={salvando}
            className="w-full bg-blue-600 py-4 rounded-2xl font-bold"
          >
            {salvando ? 'Registrando...' : 'Confirmar presença'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* CAMPO */
function Campo(props: any) {
  return (
    <input
      {...props}
      className="w-full bg-slate-800 p-4 rounded-2xl border border-slate-700"
    />
  )
}