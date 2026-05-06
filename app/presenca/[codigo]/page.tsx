'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useParams } from 'next/navigation'
import Input from '@/app/components/Input'
import Button from '@/app/components/Button'

// 🔥 FUNÇÃO DISTÂNCIA
function calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
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
}

export default function RegistrarPresenca() {
  const params = useParams()
  const codigo = params.codigo as string

  const [evento, setEvento] = useState<Evento | null>(null)
  const [nome, setNome] = useState('')
  const [matricula, setMatricula] = useState('')
  const [setor, setSetor] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [foto, setFoto] = useState<File | null>(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    buscarEvento()
  }, [])

  async function buscarEvento() {
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .eq('codigo', codigo)
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

    // 🔥 STATUS
    if (evento.status?.toUpperCase() === 'ENCERRADO') {
      alert('Evento encerrado')
      return
    }

    // 🔥 CAMPOS
    if (!nome || !matricula || !setor || !empresa || !foto) {
      alert('Preencha tudo e tire a selfie')
      return
    }

    // 🔥 HORÁRIO
    const agora = new Date()
    const inicio = new Date(`${evento.data}T${evento.hora_inicio}`)
    const fim = new Date(`${evento.data}T${evento.hora_fim}`)

    if (agora < inicio || agora > fim) {
      alert('Fora do horário permitido')
      return
    }

    setSalvando(true)

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latUser = pos.coords.latitude
        const lonUser = pos.coords.longitude

        // 🔥 GPS
        if (evento.latitude && evento.longitude) {
          const distancia = calcularDistancia(
            Number(evento.latitude),
            Number(evento.longitude),
            latUser,
            lonUser
          )

          if (distancia > 0.05) {
            setSalvando(false)
            alert('Você não está no local do evento')
            return
          }
        }

        // 🔁 DUPLICIDADE
        const { data: existe } = await supabase
          .from('presencas')
          .select('id')
          .eq('evento_id', evento.id)
          .eq('matricula', matricula)
          .maybeSingle()

        if (existe) {
          setSalvando(false)
          alert('Essa matrícula já registrou presença')
          return
        }

        // 🔥 UPLOAD FOTO (CORRIGIDO)
        const fileExt = foto.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('selfies')
          .upload(fileName, foto, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.log(uploadError)
          setSalvando(false)
          alert('Erro ao enviar foto: ' + uploadError.message)
          return
        }

        const { data: urlData } = supabase.storage
          .from('selfies')
          .getPublicUrl(fileName)

        const foto_url = urlData.publicUrl

        // ✅ SALVAR
        const { error } = await supabase.from('presencas').insert([
          {
            evento_id: evento.id,
            nome,
            matricula,
            setor,
            empresa,
            foto_url,
          },
        ])

        setSalvando(false)

        if (error) {
          console.log(error)
          alert('Erro ao salvar presença')
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
        alert('Ative a localização para registrar presença')
      }
    )
  }

  if (!evento) {
    return <div style={{ padding: 20 }}>Carregando evento...</div>
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
          borderRadius: 10,
          width: '100%',
          maxWidth: 420,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}
      >
        <h1>Registrar Presença</h1>

        <div
          style={{
            background: '#f9fafb',
            padding: 12,
            borderRadius: 8,
            marginBottom: 20
          }}
        >
          <h2>{evento.titulo}</h2>
          <p>Tipo: {evento.tipo}</p>
          <p>Data: {evento.data}</p>
          <p>Instrutor: {evento.instrutor}</p>
          <p>Status: <strong>{evento.status || 'Aberto'}</strong></p>
        </div>

        <Input label="Nome completo" value={nome} onChange={(e:any)=>setNome(e.target.value)} />
        <Input label="Matrícula" value={matricula} onChange={(e:any)=>setMatricula(e.target.value)} />
        <Input label="Setor" value={setor} onChange={(e:any)=>setSetor(e.target.value)} />
        <Input label="Empresa" value={empresa} onChange={(e:any)=>setEmpresa(e.target.value)} />

        <br />

        <input
          type="file"
          accept="image/*"
          capture="user"
          onChange={(e:any)=>setFoto(e.target.files[0])}
        />

        <br /><br />

        <Button onClick={registrarPresenca}>
          {salvando ? 'Salvando...' : 'Confirmar presença'}
        </Button>
      </div>
    </div>
  )
}