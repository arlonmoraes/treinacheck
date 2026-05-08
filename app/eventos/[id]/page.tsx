'use client'

import LayoutAdmin from '@/app/components/LayoutAdmin'
import Protegido from '@/app/components/Protegido'
import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useParams } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'

type Evento = {
  id: string
  titulo: string
  tipo: string
  data: string
  instrutor: string
  codigo: string
  exigir_selfie: boolean
}

export default function EventoDetalhe() {
  const params = useParams()

  const [evento, setEvento] = useState<Evento | null>(null)
  const [presencas, setPresencas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregar() {
      const id = params.id as string

      if (!id) return

      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.log(error)
        alert('Erro ao buscar evento')
        setLoading(false)
        return
      }

      setEvento(data)

      const { data: lista } = await supabase
        .from('presencas')
        .select('*')
        .eq('evento_id', data.id)
        .order('data_hora', { ascending: false })

      setPresencas(lista || [])

      setLoading(false)
    }

    carregar()
  }, [])

  function exportarCSV() {
    if (!evento) return

    const linhas = [
      ['Nome', 'Matrícula', 'Setor', 'Empresa', 'Data/Hora', 'Foto'],
      ...presencas.map((p) => [
        p.nome,
        p.matricula,
        p.setor,
        p.empresa,
        new Date(p.data_hora).toLocaleString(),
        p.foto_url || '',
      ]),
    ]

    const csv = linhas
      .map((linha) => linha.map((campo) => `"${campo}"`).join(';'))
      .join('\n')

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')

    link.href = url
    link.download = `presencas-${evento.titulo}.csv`
    link.click()

    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        Carregando...
      </div>
    )
  }

  if (!evento) {
    return (
      <div style={{ padding: 20 }}>
        Evento não encontrado
      </div>
    )
  }

  const linkPresenca = `https://treinacheck.vercel.app/presenca/${evento.codigo}`

  return (
    <Protegido>
      <LayoutAdmin>
        <div style={{ padding: 20 }}>
          <h1>{evento.titulo}</h1>

          <p>Tipo: {evento.tipo}</p>

          <p>Data: {evento.data}</p>

          <p>Instrutor: {evento.instrutor}</p>

	  <p>
 	    Selfie obrigatória:{' '}
  	    <strong>
    	      {evento.exigir_selfie ? 'SIM' : 'NÃO'}
  	   </strong>
	 </p>

          <h2>QR Code de Presença</h2>

          <div
            style={{
              background: 'white',
              padding: 16,
              display: 'inline-block',
              borderRadius: 10,
            }}
          >
            <QRCodeSVG
              value={linkPresenca}
              size={200}
            />
          </div>

          <p style={{ marginTop: 10 }}>
            {linkPresenca}
          </p>

          <hr />

          <h2>Lista de Presença</h2>

          <button
            onClick={exportarCSV}
            style={{
              background: '#16a34a',
              color: 'white',
              border: 'none',
              padding: '10px 14px',
              borderRadius: 6,
              cursor: 'pointer',
              marginBottom: 20,
            }}
          >
            Exportar CSV
          </button>

          {presencas.length === 0 && (
            <p>Nenhuma presença registrada ainda</p>
          )}

          {presencas.map((p) => (
            <div
              key={p.id}
              style={{
                borderBottom: '1px solid #ddd',
                padding: 12,
                display: 'flex',
                gap: 12,
                alignItems: 'center',
              }}
            >
              {p.foto_url && (
                <img
                  src={p.foto_url}
                  alt="selfie"
                  onClick={() =>
                    window.open(p.foto_url, '_blank')
                  }
                  style={{
                    width: 60,
                    height: 60,
                    objectFit: 'cover',
                    borderRadius: 8,
                    border: '1px solid #ccc',
                    cursor: 'pointer',
                  }}
                />
              )}

              <div>
                <strong>{p.nome}</strong>

                <br />

                Matrícula: {p.matricula}

                <br />

                Setor: {p.setor}

                <br />

                Empresa: {p.empresa}

                <br />

                Hora:{' '}
                {new Date(
                  p.data_hora
                ).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </LayoutAdmin>
    </Protegido>
  )
}