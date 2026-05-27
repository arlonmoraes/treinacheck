export function formatarDataHora(
  data: string
) {
  return new Date(data).toLocaleString(
    'pt-BR',
    {
      timeZone: 'America/Sao_Paulo',
    }
  )
}

export function formatarHora(
  data: string
) {
  return new Date(data).toLocaleTimeString(
    'pt-BR',
    {
      timeZone: 'America/Sao_Paulo',
    }
  )
}

export function formatarData(
  data: string
) {
  return new Date(data).toLocaleDateString(
    'pt-BR',
    {
      timeZone: 'America/Sao_Paulo',
    }
  )
}