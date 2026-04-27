'use client'

import { useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import Protegido from '@/app/components/Protegido'

export default function Relatorios() {
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [dados, setDados] = useState<any[]>([])

  async function buscar() {
    if (!dataInicio || !dataFim) {
      alert('Informe o período')
      return
    }

    const { data, error } = await supabase
      .from('presencas')
      .select('*')
      .gte('data_hora', dataInicio)
      .lte('data_hora', dataFim + ' 23:59:59')

    if (error) {
      console.log(error)
      alert('Erro ao buscar dados')
      return
    }

    setDados(data || [])
  }

  function exportarCSV() {
    const linhas = [
      ['Nome', 'Matrícula', 'Setor', 'Empresa', 'Data/Hora'],
      ...dados.map((p) => [
        p.nome,
        p.matricula,
        p.setor,
        p.empresa,
        new Date(p.data_hora).toLocaleString(),
      ]),
    ]

    const csv = linhas
      .map((linha) => linha.map((campo) => `"${campo}"`).join(';'))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `relatorio.csv`
    link.click()

    URL.revokeObjectURL(url)
  }

  return (
    <Protegido>
      <div style={{ padding: 20 }}>
        <h1>Relatórios</h1>

        <input
          type="date"
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
        />

        <br /><br />

        <input
          type="date"
          value={dataFim}
          onChange={(e) => setDataFim(e.target.value)}
        />

        <br /><br />

        <button onClick={buscar}>Buscar</button>

        <br /><br />

        <button onClick={exportarCSV}>Exportar CSV</button>

        <hr />

        {dados.map((p) => (
          <div key={p.id} style={{ borderBottom: '1px solid #ccc', padding: 8 }}>
            <strong>{p.nome}</strong>
            <br />
            {p.matricula} - {p.setor}
            <br />
            {new Date(p.data_hora).toLocaleString()}
          </div>
        ))}
      </div>
    </Protegido>
  )
}