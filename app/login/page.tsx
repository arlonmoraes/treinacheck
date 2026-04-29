'use client'

import { useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'
import Input from '@/app/components/Input'
import Button from '@/app/components/Button'

export default function Login() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function entrar() {
    if (!email || !senha) {
      alert('Informe e-mail e senha')
      return
    }

    setCarregando(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    })

    setCarregando(false)

    if (error) {
      alert('E-mail ou senha inválidos')
      console.log(error)
      return
    }

    router.push('/')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f4f6f8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        color: '#111827'
      }}
    >
      <div
        style={{
          background: 'white',
          padding: 30,
          borderRadius: 10,
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}
      >
        <h1>TreinaCheck</h1>
        <p>Acesse o sistema de presença digital.</p>

        <br />

        <Input
          label="E-mail"
          type="email"
          value={email}
          onChange={(e: any) => setEmail(e.target.value)}
        />

        <Input
          label="Senha"
          type="password"
          value={senha}
          onChange={(e: any) => setSenha(e.target.value)}
        />

        <Button onClick={entrar}>
          {carregando ? 'Entrando...' : 'Entrar'}
        </Button>
      </div>
    </div>
  )
}