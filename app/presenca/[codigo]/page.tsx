'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useParams } from 'next/navigation'
import Input from '@/app/components/Input'
import Button from '@/app/components/Button'

type Evento = {
  id: string
  titulo: string
  tipo: string
  data: string
  instrutor: string
  codigo: string
  status: string
}

export default function RegistrarPresenca() {
  const params = useParams()
  const codigo = params.codigo as string

  const [evento, setEvento] = useState<Evento | null>(null)
  const [nome, setNome] = useState('')
  const [matricula, setMatricula] = useState('')
  const [setor, setSetor] = useState('')
  const [empresa, setEmpresa] = useState('')
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

    if (evento.status === 'Encerrado') {
      alert('Este evento já foi encerrado. Não é mais possível registrar presença.')
      return
    }

    if (!nome || !matricula || !setor || !empresa) {
      alert('Preencha todos os campos')
      return
    }

    setSalvando(true)

    const { data: presencaExistente } = await supabase
      .from('presencas')
      .select('id')
      .eq('evento_id', evento.id)
      .eq('matricula', matricula)
      .maybeSingle()

    if (presencaExistente) {
      setSalvando(false)
      alert('Essa matrícula já registrou presença neste evento.')
      return
    }

    const { error } = await supabase.from('presencas').insert([
      {
        evento_id: evento.id,
        nome,
        matricula,
        setor,
        empresa,
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
	  <p>
  	     Status: <strong>{evento.status || 'Aberto'}</strong>
	 </p> 
        </div>

        <Input
          label="Nome completo"
          value={nome}
          onChange={(e: any) => setNome(e.target.value)}
        />

        <Input
          label="Matrícula"
          value={matricula}
          onChange={(e: any) => setMatricula(e.target.value)}
        />

        <Input
          label="Setor"
          value={setor}
          onChange={(e: any) => setSetor(e.target.value)}
        />

        <Input
          label="Empresa"
          value={empresa}
          onChange={(e: any) => setEmpresa(e.target.value)}
        />

        <Button onClick={registrarPresenca}>
          {salvando ? 'Salvando...' : 'Confirmar presença'}
        </Button>
      </div>
    </div>
  )
}