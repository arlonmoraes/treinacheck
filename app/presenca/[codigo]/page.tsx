'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useParams } from 'next/navigation'
import Input from '@/app/components/Input'
import Button from '@/app/components/Button'

function calcularDistancia(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371

  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
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
  const [matricula, setMatricula] = useState('')
  const [setor, setSetor] = useState('')
  const [empresa, setEmpresa] = useState('')

  const [foto, setFoto] = useState<File | null>(null)

  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!codigo) return

    buscarEvento()
  }, [codigo])

  async function buscarEvento() {
    console.log('CODIGO:', codigo)

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

    if (!nome || !matricula || !setor || !empresa) {
      alert('Preencha todos os campos')
      return
    }

    if (evento.exigir_selfie && !foto) {
      alert('Tire uma selfie')
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

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latitudeUsuario = pos.coords.latitude
        const longitudeUsuario = pos.coords.longitude

        if (
          evento.latitude &&
          evento.longitude
        ) {
          const distancia = calcularDistancia(
            latitudeUsuario,
            longitudeUsuario,
            evento.latitude,
            evento.longitude
          )

          if (distancia > 0.1) {
            setSalvando(false)

            alert(
              'Você não está no local do treinamento'
            )

            return
          }
        }

        const { data: presencaExistente } =
          await supabase
            .from('presencas')
            .select('id')
            .eq('evento_id', evento.id)
            .eq('matricula', matricula)
            .maybeSingle()

        if (presencaExistente) {
          setSalvando(false)

          alert(
            'Essa matrícula já registrou presença'
          )

          return
        }

        const nomeArquivo = `${Date.now()}-${foto.name}`

        const { error: erroUpload } =
          await supabase.storage
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
        } = supabase.storage
          .from('selfies')
          .getPublicUrl(nomeArquivo)

        const { error } = await supabase
          .from('presencas')
          .insert([
            {
              evento_id: evento.id,
              nome,
              matricula,
              setor,
              empresa,
              foto_url: publicUrl,
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
        setMatricula('')
        setSetor('')
        setEmpresa('')
        setFoto(null)
      },
      () => {
        setSalvando(false)

        alert(
          'Permita acesso à localização'
        )
      }
    )
  }

  if (!evento) {
    return (
      <div style={{ padding: 20 }}>
        Carregando evento...
      </div>
    )
  }

  return (
    <div
  style={{
    minHeight: '100vh',
    background: '#f4f6f8',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    color: '#111827'
  }}
>
      <div
        style={{
          background: 'white',
          padding: 24,
          borderRadius: 12,
          width: '100%',
          maxWidth: 420,
          boxShadow:
            '0 4px 20px rgba(0,0,0,0.08)',
        }}
      >
        <h1>Registrar Presença</h1>

        <div
          style={{
            background: '#f9fafb',
            padding: 12,
            borderRadius: 8,
            marginBottom: 20,
          }}
        >
          <h2>{evento.titulo}</h2>

          <p>Tipo: {evento.tipo}</p>

          <p>Data: {evento.data}</p>

          <p>Instrutor: {evento.instrutor}</p>

          <p>
            Status:{' '}
            <strong>
              {evento.status || 'Aberto'}
            </strong>
          </p>
        </div>

        <Input
          label="Nome completo"
          value={nome}
          onChange={(e: any) =>
            setNome(e.target.value)
          }
        />

        <Input
          label="Matrícula"
          value={matricula}
          onChange={(e: any) =>
            setMatricula(e.target.value)
          }
        />

        <Input
          label="Setor"
          value={setor}
          onChange={(e: any) =>
            setSetor(e.target.value)
          }
        />

        <Input
          label="Empresa"
          value={empresa}
          onChange={(e: any) =>
            setEmpresa(e.target.value)
          }
        />

        <div style={{ marginBottom: 16 }}>
          <label>Selfie</label>

          <input
            type="file"
            accept="image/*"
            capture="user"
            onChange={(e: any) =>
              setFoto(e.target.files[0])
            }
          />
        </div>

        <Button onClick={registrarPresenca}>
          {salvando
            ? 'Salvando...'
            : 'Confirmar presença'}
        </Button>
      </div>
    </div>
  )
}