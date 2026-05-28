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
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
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
      alert('Evento não encontrado')
      return
    }

    setEvento(data)
  }

  async function registrarPresenca() {
    if (!evento) return

    if (!nome || !setor) {
      alert('Preencha todos os campos')
      return
    }

    setSalvando(true)
    setMensagem('Buscando funcionário...')

    // 🔥 BUSCA POR NOME (usuário digita nome mesmo)
    const { data: funcionario, error } = await supabase
      .from('funcionarios')
      .select('*')
      .ilike('nome', nome.trim())
      .maybeSingle()

    if (error || !funcionario) {
      setSalvando(false)
      alert('Funcionário não encontrado')
      return
    }

    setMensagem('Validando localização...')

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lon = pos.coords.longitude

        if (evento.latitude && evento.longitude) {
          const dist = calcularDistancia(
            lat,
            lon,
            evento.latitude,
            evento.longitude
          )

          if (dist > 0.01) {
            setSalvando(false)
            alert('Você não está no local do evento')
            return
          }
        }

        let fotoUrl = ''

        if (foto) {
          setMensagem('Enviando selfie...')

          const fileName = `${Date.now()}-${foto.name}`

          const { error: uploadError } = await supabase.storage
            .from('selfies')
            .upload(fileName, foto)

          if (uploadError) {
            setSalvando(false)
            alert('Erro ao enviar selfie')
            return
          }

          const { data: publicUrl } = supabase.storage
            .from('selfies')
            .getPublicUrl(fileName)

          fotoUrl = publicUrl.publicUrl
        }

        setMensagem('Registrando presença...')

        // 🔥 AQUI É O MAIS IMPORTANTE
        await supabase.from('presencas').insert([
          {
            evento_id: evento.id,

            // 👇 usuário digita nome
            nome: funcionario.nome,

            // 👇 relatório usa matrícula
            matricula: funcionario.matricula,

            // 👇 empresa sempre correta
            empresa: funcionario.empresa,

            setor,
            foto_url: fotoUrl,
            data_hora: new Date().toISOString(),
          },
        ])

        setSalvando(false)

        alert('Presença registrada com sucesso!')

        setNome('')
        setSetor('')
        setFoto(null)
        setMensagem('')
      },
      () => {
        setSalvando(false)
        alert('Permita localização')
      }
    )
  }

  if (!evento) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Carregando...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex justify-center items-center p-6">
      <div className="w-full max-w-xl bg-slate-900 p-8 rounded-3xl">

        <h1 className="text-3xl font-bold mb-6">
          📲 Check-in
        </h1>

        <div className="mb-6">
          <p className="text-slate-400">{evento.titulo}</p>
        </div>

        {/* INPUT NOME */}
        <input
          placeholder="Nome completo"
          value={nome}
          onChange={(e) =>
            setNome(e.target.value.toUpperCase())
          }
          className="w-full p-4 mb-4 rounded-2xl bg-slate-800"
        />

        {/* INPUT SETOR */}
        <input
          placeholder="Setor"
          value={setor}
          onChange={(e) => setSetor(e.target.value)}
          className="w-full p-4 mb-4 rounded-2xl bg-slate-800"
        />

        {/* SELFIE */}
        <input
          type="file"
          accept="image/*"
          capture="user"
          onChange={(e: any) =>
            setFoto(e.target.files[0])
          }
          className="mb-4"
        />

        {mensagem && (
          <p className="text-blue-400 mb-4">
            {mensagem}
          </p>
        )}

        <button
          onClick={registrarPresenca}
          disabled={salvando}
          className="w-full bg-blue-600 p-4 rounded-2xl font-bold"
        >
          {salvando ? 'Registrando...' : 'Confirmar presença'}
        </button>
      </div>
    </div>
  )
}