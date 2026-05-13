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

  const dLat =
    ((lat2 - lat1) * Math.PI) / 180

  const dLon =
    ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) *
      Math.sin(dLat / 2) +
    Math.cos(
      (lat1 * Math.PI) / 180
    ) *
      Math.cos(
        (lat2 * Math.PI) / 180
      ) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    )

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

  const codigo =
    params?.codigo?.toString()

  const [evento, setEvento] =
    useState<Evento | null>(null)

  const [nome, setNome] =
    useState('')

  const [matricula, setMatricula] =
    useState('')

  const [setor, setSetor] =
    useState('')

  const [empresa, setEmpresa] =
    useState('')

  const [foto, setFoto] =
    useState<File | null>(null)

  const [salvando, setSalvando] =
    useState(false)

  const [mensagem, setMensagem] =
    useState('')

  useEffect(() => {
    if (!codigo) return

    buscarEvento()
  }, [codigo])

  async function buscarEvento() {
    const { data, error } =
      await supabase
        .from('eventos')
        .select('*')
        .eq(
          'codigo',
          String(codigo).trim()
        )
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

    /* HORÁRIOS */
    const agora = new Date()

    const inicio = new Date(
      `${evento.data}T${evento.hora_inicio}`
    )

    const fim = new Date(
      `${evento.data}T${evento.hora_fim}`
    )

    /* ENCERRAR AUTOMATICAMENTE */
    if (
      agora > fim &&
      evento.status !== 'Encerrado'
    ) {
      await supabase
        .from('eventos')
        .update({
          status: 'Encerrado',
        })
        .eq('id', evento.id)

      evento.status = 'Encerrado'
    }

    /* EVENTO ENCERRADO */
    if (
      evento.status === 'Encerrado'
    ) {
      alert('Evento encerrado')

      return
    }

    /* FORA DO HORÁRIO */
    if (
      agora < inicio ||
      agora > fim
    ) {
      alert(
        'Fora do horário permitido'
      )

      return
    }

    /* VALIDAÇÃO */
    if (
      !nome ||
      !matricula ||
      !setor ||
      !empresa
    ) {
      alert('Preencha todos os campos')

      return
    }

    /* SELFIE */
    if (
      evento.exigir_selfie &&
      !foto
    ) {
      alert('Selfie obrigatória')

      return
    }

    setSalvando(true)

    setMensagem(
      'Validando localização...'
    )

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latitudeUsuario =
          pos.coords.latitude

        const longitudeUsuario =
          pos.coords.longitude

        /* GPS */
        if (
          evento.latitude &&
          evento.longitude
        ) {
          const distancia =
            calcularDistancia(
              latitudeUsuario,
              longitudeUsuario,
              evento.latitude,
              evento.longitude
            )

          // 10 metros
          if (distancia > 0.01) {
            setSalvando(false)

            alert(
              'Você não está no local do treinamento'
            )

            return
          }
        }

        setMensagem(
          'Validando matrícula...'
        )

        /* DUPLICIDADE */
        const {
          data: presencaExistente,
        } = await supabase
          .from('presencas')
          .select('id')
          .eq('evento_id', evento.id)
          .eq(
            'matricula',
            matricula
          )
          .maybeSingle()

        if (presencaExistente) {
          setSalvando(false)

          alert(
            'Essa matrícula já registrou presença'
          )

          return
        }

        let fotoUrl = ''

        /* UPLOAD SELFIE */
        if (foto) {
          setMensagem(
            'Enviando selfie...'
          )

          const nomeArquivo = `${Date.now()}-${foto.name}`

          const {
            error: erroUpload,
          } =
            await supabase.storage
              .from('selfies')
              .upload(
                nomeArquivo,
                foto
              )

          if (erroUpload) {
            console.log(
              erroUpload
            )

            setSalvando(false)

            alert(
              'Erro ao enviar selfie'
            )

            return
          }

          const {
            data: { publicUrl },
          } = supabase.storage
            .from('selfies')
            .getPublicUrl(
              nomeArquivo
            )

          fotoUrl = publicUrl
        }

        setMensagem(
          'Registrando presença...'
        )

        /* REGISTRAR */
        const { error } =
          await supabase
            .from('presencas')
            .insert([
              {
                evento_id:
                  evento.id,
                nome,
                matricula,
                setor,
                empresa,
                foto_url: fotoUrl,
              },
            ])

        setSalvando(false)

        if (error) {
          console.log(error)

          alert(
            'Erro ao registrar presença'
          )

          return
        }

        alert(
          'Presença registrada com sucesso!'
        )

        /* RESET */
        setNome('')
        setMatricula('')
        setSetor('')
        setEmpresa('')
        setFoto(null)
        setMensagem('')
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
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Carregando evento...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex justify-center items-center p-5">
      <div
        className="
          w-full
          max-w-xl
          bg-slate-900
          border
          border-slate-800
          rounded-[32px]
          shadow-2xl
          p-8
        "
      >
        {/* LOGO */}
        <div className="flex justify-center mb-6">
          <img
            src="/logo.png"
            alt="Logo"
            className="h-20 object-contain"
          />
        </div>

        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold">
            📲 Check-in
          </h1>

          <p className="text-slate-400 mt-2">
            Registro de presença
          </p>
        </div>

        {/* EVENTO */}
        <div className="bg-slate-800 rounded-3xl p-6 space-y-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold">
              {evento.titulo}
            </h2>

            <p className="text-slate-400">
              {evento.tipo}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Info
              titulo="📅 Data"
              valor={evento.data}
            />

            <Info
              titulo="👨‍🏫 Instrutor"
              valor={evento.instrutor}
            />

            <Info
              titulo="🕒 Horário"
              valor={`${evento.hora_inicio} - ${evento.hora_fim}`}
            />

            <Info
              titulo="📸 Selfie"
              valor={
                evento.exigir_selfie
                  ? 'Obrigatória'
                  : 'Opcional'
              }
            />
          </div>
        </div>

        {/* FORM */}
        <div className="space-y-5">
          <Campo
            placeholder="Nome completo"
            value={nome}
            onChange={(e: any) =>
              setNome(e.target.value)
            }
          />

          <Campo
            placeholder="Matrícula"
            value={matricula}
            onChange={(e: any) =>
              setMatricula(
                e.target.value
              )
            }
          />

          <Campo
            placeholder="Setor"
            value={setor}
            onChange={(e: any) =>
              setSetor(e.target.value)
            }
          />

          <Campo
            placeholder="Empresa"
            value={empresa}
            onChange={(e: any) =>
              setEmpresa(
                e.target.value
              )
            }
          />

          {/* SELFIE */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
            <label className="block mb-3 font-semibold">
              📸 Selfie
            </label>

            <input
              type="file"
              accept="image/*"
              capture="user"
              onChange={(e: any) =>
                setFoto(
                  e.target.files[0]
                )
              }
            />

            {foto && (
              <p className="text-green-400 mt-3 text-sm">
                ✅ Foto selecionada
              </p>
            )}
          </div>

          {/* LOADING */}
          {mensagem && (
            <div className="bg-blue-500/20 text-blue-300 p-4 rounded-2xl text-center">
              {mensagem}
            </div>
          )}

          {/* BOTÃO */}
          <button
            onClick={
              registrarPresenca
            }
            disabled={salvando}
            className="
              w-full
              bg-blue-600
              hover:bg-blue-700
              disabled:opacity-50
              transition-all
              py-4
              rounded-2xl
              text-lg
              font-bold
              shadow-2xl
            "
          >
            {salvando
              ? 'Registrando...'
              : 'Confirmar presença'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* INFO */
function Info({
  titulo,
  valor,
}: any) {
  return (
    <div className="bg-slate-900 p-4 rounded-2xl">
      <p className="text-slate-400 text-sm">
        {titulo}
      </p>

      <strong>{valor}</strong>
    </div>
  )
}

/* CAMPO */
function Campo(props: any) {
  return (
    <input
      {...props}
      className="
        w-full
        bg-slate-800
        border
        border-slate-700
        rounded-2xl
        p-4
        outline-none
        focus:border-blue-500
        transition-all
      "
    />
  )
}