'use client'

import { useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export default function NovoEvento() {
  const [titulo, setTitulo] = useState('')
  const [tipo, setTipo] = useState('DDS')
  const [data, setData] = useState('')
  const [instrutor, setInstrutor] = useState('')

  const criarEvento = async () => {
    const codigo = uuidv4()

    const { error } = await supabase.from('eventos').insert([
      {
        titulo,
        tipo,
        data,
        instrutor,
        codigo,
      },
    ])

    if (error) {
      alert('Erro ao criar evento')
      console.log(error)
    } else {
      alert('Evento criado com sucesso!')
      setTitulo('')
      setData('')
      setInstrutor('')
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Criar Evento</h1>

      <input
        placeholder="Título"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
      />
      <br /><br />

      <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
        <option value="DDS">DDS</option>
        <option value="DDQ">DDQ</option>
        <option value="Treinamento">Treinamento</option>
      </select>
      <br /><br />

      <input
        type="date"
        value={data}
        onChange={(e) => setData(e.target.value)}
      />
      <br /><br />

      <input
        placeholder="Instrutor"
        value={instrutor}
        onChange={(e) => setInstrutor(e.target.value)}
      />
      <br /><br />

      <button onClick={criarEvento}>Salvar</button>
    </div>
  )
}