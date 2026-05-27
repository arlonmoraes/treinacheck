export function formatarDataHora(
  data: string
) {
  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      timeZone:
        'America/Sao_Paulo',

      dateStyle: 'short',

      timeStyle: 'medium',
    }
  ).format(new Date(data))
}

export function formatarHora(
  data: string
) {
  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      timeZone:
        'America/Sao_Paulo',

      hour: '2-digit',

      minute: '2-digit',

      second: '2-digit',
    }
  ).format(new Date(data))
}