'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Protegido({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    verificarLogin()
  }, [])

  async function verificarLogin() {
    const { data } = await supabase.auth.getSession()

    if (!data.session) {
      router.push('/login')
      return
    }

    setCarregando(false)
  }

  if (carregando) {
    return <div style={{ padding: 20 }}>Verificando acesso...</div>
  }

  return <>{children}</>
}