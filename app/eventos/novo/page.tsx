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
  const [horaInicio, setHoraInicio] = useState('')
  const [horaFim, setHoraFim] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [salvando, setSalvando] = useState(false)

  // 🔥 NOVO
  const [exigirSelfie, setExigirSelfie] = useState(false)

  const pegarLocalizacao = () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não suportada')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toString())
        setLongitude(pos.coords.longitude.toString())

        alert('Localização capturada com sucesso!')
      },
      () => {
        alert('Erro ao capturar localização')
      }
    )
  }

  const criarEvento = async () => {
    if (
      !titulo ||
      !data ||
      !instrutor ||
      !horaInicio ||
      !horaFim
    ) {
      alert('Preencha todos os campos')
      return
    }

    setSalvando(true)

    const codigo = uuidv4()

    const { data: userData } =
      await supabase.auth.getUser()

    const { error } = await supabase
      .from('eventos')
      .insert([
        {
          titulo,
          tipo,
          data,
          instrutor,
          codigo,

          criado_por: userData.user?.id,

          hora_inicio: horaInicio,
          hora_fim: horaFim,

          latitude: latitude
            ? Number(latitude)
            : null,

          longitude: longitude
            ? Number(longitude)
            : null,

          // 🔥 NOVO
          exigir_selfie: exigirSelfie,


	  status: 'Aberto',
        },
      ])

    setSalvando(false)

    if (error) {
      console.log(error)
      alert('Erro ao criar evento')
      return
    }

    alert('Evento criado com sucesso!')

    // RESET
    setTitulo('')
    setData('')
    setInstrutor('')
    setHoraInicio('')
    setHoraFim('')
    setLatitude('')
    setLongitude('')
    setExigirSelfie(false)
  }

  return (
    <Protegido>
      <LayoutAdmin>
        <h1>Criar Evento</h1>

        <div style={{ maxWidth: 400 }}>
          <Input
            label="Título"
            value={titulo}
            onChange={(e: any) =>
              setTitulo(e.target.value)
            }
          />

          <div style={{ marginBottom: 12 }}>
            <label>Tipo</label>

            <select
  value={tipo}
  onChange={(e) =>
    setTipo(e.target.value)
  }
  style={{
    width: '100%',
    padding: 10,
    borderRadius: 8,
    border: '1px solid #334155',
    background: 'white',
    color: '#111827',
    fontSize: 16,
    outline: 'none',
  }}
>
  <option
    value="DDS"
    style={{ color: '#111827' }}
  >
    DDS
  </option>

  <option
    value="DDQ"
    style={{ color: '#111827' }}
  >
    DDQ
  </option>

  <option
    value="Treinamento"
    style={{ color: '#111827' }}
  >
    Treinamento
  </option>
</select>
          </div>

          <Input
            label="Data"
            type="date"
            value={data}
            onChange={(e: any) =>
              setData(e.target.value)
            }
          />

          <Input
            label="Hora início"
            type="time"
            value={horaInicio}
            onChange={(e: any) =>
              setHoraInicio(e.target.value)
            }
          />

          <Input
            label="Hora fim"
            type="time"
            value={horaFim}
            onChange={(e: any) =>
              setHoraFim(e.target.value)
            }
          />

          <Input
            label="Instrutor"
            value={instrutor}
            onChange={(e: any) =>
              setInstrutor(e.target.value)
            }
          />

          {/* 🔥 GPS */}
          <button
            style={{
              width: '100%',
              padding: 10,
              background: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              marginTop: 10,
              cursor: 'pointer',
            }}
            onClick={pegarLocalizacao}
          >
            📍 Usar minha localização
          </button>

          {/* 🔍 COORDENADAS */}
          {latitude && longitude && (
            <p
              style={{
                fontSize: 12,
                color: '#555',
                marginTop: 8,
              }}
            >
              Lat: {latitude}

              <br />

              Lng: {longitude}
            </p>
          )}

          {/* 🔥 SELFIE */}
          <div style={{ marginTop: 16 }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={exigirSelfie}
                onChange={(e) =>
                  setExigirSelfie(
                    e.target.checked
                  )
                }
              />

              Exigir selfie para presença
            </label>
          </div>

          <br />

          <Button onClick={criarEvento}>
            {salvando
              ? 'Salvando...'
              : 'Salvar'}
          </Button>
        </div>
      </LayoutAdmin>
    </Protegido>
  )
}