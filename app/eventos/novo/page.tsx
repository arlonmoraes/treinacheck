'use client'

import LayoutAdmin from '@/app/components/LayoutAdmin'
import Protegido from '@/app/components/Protegido'
import Input from '@/app/components/Input'
import Button from '@/app/components/Button'
import { useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export default function NovoEvento() {
  const [titulo, setTitulo] = useState('')
  const [tipo, setTipo] = useState('DDS')
  const [data, setData] = useState('')
  const [instrutor, setInstrutor] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [horaInicio, setHoraInicio] = useState('')
  const [horaFim, setHoraFim] = useState('')

  const criarEvento = async () => {
    if (!titulo || !data || !instrutor || !horaInicio || !horaFim) {
      alert('Preencha todos os campos')
      return
    }

    setSalvando(true)

    const codigo = uuidv4()

    // 🔥 pega usuário logado
    const { data: userData } = await supabase.auth.getUser()

    const { error } = await supabase.from('eventos').insert([
  {
    titulo,
    tipo,
    data,
    instrutor,
    codigo,
    criado_por: userData.user?.id,
    hora_inicio: horaInicio,
    hora_fim: horaFim,
  },
])

    setSalvando(false)

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
    <Protegido>
      <LayoutAdmin>
        <h1>Criar Evento</h1>

        <div style={{ maxWidth: 400 }}>
          <Input
            label="Título"
            value={titulo}
            onChange={(e: any) => setTitulo(e.target.value)}
          />

          <div style={{ marginBottom: 12 }}>
            <label>Tipo</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              style={{
                width: '100%',
                padding: 8,
                borderRadius: 6,
                border: '1px solid #ccc'
              }}
            >
              <option value="DDS">DDS</option>
              <option value="DDQ">DDQ</option>
              <option value="Treinamento">Treinamento</option>
            </select>
          </div>

          <Input
            label="Data"
            type="date"
            value={data}
            onChange={(e: any) => setData(e.target.value)}

          />
	  <Input
  	    label="Hora início"
	    type="time"
	    value={horaInicio}
	    onChange={(e: any) => setHoraInicio(e.target.value)}
	  />

	 <Input
 	   label="Hora fim"
 	   type="time"
 	   value={horaFim}
  	   onChange={(e: any) => setHoraFim(e.target.value)}
	  />

          <Input
            label="Instrutor"
            value={instrutor}
            onChange={(e: any) => setInstrutor(e.target.value)}
          />

          <br />

          <Button onClick={criarEvento}>
            {salvando ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </LayoutAdmin>
    </Protegido>
  )
}