'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useParams } from 'next/navigation'
import Input from '@/app/components/Input'
import Button from '@/app/components/Button'

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
    const { data } = await supabase
      .from('eventos')
      .select('*')
      .eq('codigo', codigo)
      .single()

    setEvento(data)
  }

  async function registrarPresenca() {
    if (!evento) return

    if (evento.status?.toUpperCase() === 'ENCERRADO') {
      alert('Evento encerrado')
      return
    }

    if (!nome || !matricula || !setor || !empresa || !foto) {
      alert('Preencha tudo e tire a selfie')
      return
    }

    // horário
    const agora = new Date()
    const inicio = new Date(`${evento.data}T${evento.hora_inicio}`)
    const fim = new Date(`${evento.data}T${evento.hora_fim}`)

    if (agora < inicio || agora > fim) {
      alert('Fora do horário')
      return
    }

    setSalvando(true)

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const latUser = pos.coords.latitude
      const lonUser = pos.coords.longitude

      if (evento.latitude && evento.longitude) {
        const distancia = calcularDistancia(
          evento.latitude,
          evento.longitude,
          latUser,
          lonUser
        )

        if (distancia > 0.05) {
          setSalvando(false)
          alert('Você não está no local')
          return
        }
      }

      // upload da foto
      const fileName = `${Date.now()}-${matricula}.jpg`

      const { error: uploadError } = await supabase.storage
        .from('selfies')
        .upload(fileName, foto)

      if (uploadError) {
        setSalvando(false)
        alert('Erro ao enviar foto')
        return
      }

      const { data: urlData } = supabase.storage
        .from('selfies')
        .getPublicUrl(fileName)

      const foto_url = urlData.publicUrl

      // duplicidade
      const { data: existe } = await supabase
        .from('presencas')
        .select('id')
        .eq('evento_id', evento.id)
        .eq('matricula', matricula)
        .maybeSingle()

      if (existe) {
        setSalvando(false)
        alert('Já registrado')
        return
      }

      // salvar
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
        alert('Erro ao salvar')
        return
      }

      alert('Presença registrada com selfie!')

      setNome('')
      setMatricula('')
      setSetor('')
      setEmpresa('')
      setFoto(null)
    })
  }

  if (!evento) return <div>Carregando...</div>

  return (
    <div style={{ padding: 20 }}>
      <h1>{evento.titulo}</h1>

      <Input label="Nome" value={nome} onChange={(e:any)=>setNome(e.target.value)} />
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
  )
}