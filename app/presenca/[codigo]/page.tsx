'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useParams } from 'next/navigation'

type Evento = {
  id: string
  titulo: string
  tipo: string
  data: string
  instrutor: string
  codigo: string
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

    if (!nome || !matricula || !setor || !empresa) {
      alert('Preencha todos os campos')
      return
    }

    setSalvando(true)

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
    return <div style={{ padding: 20 }}>Carregando evento...</div>
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Registrar Presença</h1>

      <h2>{evento.titulo}</h2>
      <p>Tipo: {evento.tipo}</p>
      <p>Data: {evento.data}</p>
      <p>Instrutor: {evento.instrutor}</p>

      <hr />

      <input
        placeholder="Nome completo"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
      />
      <br /><br />

      <input
        placeholder="Matrícula"
        value={matricula}
        onChange={(e) => setMatricula(e.target.value)}
      />
      <br /><br />

      <input
        placeholder="Setor"
        value={setor}
        onChange={(e) => setSetor(e.target.value)}
      />
      <br /><br />

      <input
        placeholder="Empresa"
        value={empresa}
        onChange={(e) => setEmpresa(e.target.value)}
      />
      <br /><br />

      <button onClick={registrarPresenca} disabled={salvando}>
        {salvando ? 'Salvando...' : 'Confirmar presença'}
      </button>
    </div>
  )
}