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
  const [carregando, setCarregando] =
    useState(false)

  /* LOGIN EMAIL */
  async function entrar() {
    if (!email || !senha) {
      alert('Informe e-mail e senha')
      return
    }

    setCarregando(true)

    const { error } =
      await supabase.auth.signInWithPassword({
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

  /* LOGIN MICROSOFT */
  async function loginMicrosoft() {
    setCarregando(true)

    const { error } =
      await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo:
            'https://treinacheck.vercel.app',
        },
      })

    setCarregando(false)

    if (error) {
      console.log(error)

      alert(
        'Erro ao entrar com Microsoft'
      )
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(to bottom right, #020617, #0f172a)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        color: 'white',
      }}
    >
      <div
        style={{
          background: '#0f172a',
          padding: 40,
          borderRadius: 24,
          width: '100%',
          maxWidth: 420,
          border: '1px solid #1e293b',
          boxShadow:
            '0 20px 60px rgba(0,0,0,0.4)',
        }}
      >
        {/* HEADER */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: 30,
          }}
        >
          <h1
            style={{
              fontSize: 38,
              fontWeight: 'bold',
              marginBottom: 10,
            }}
          >
            🚀 TreinaCheck
          </h1>

          <p
            style={{
              color: '#94a3b8',
            }}
          >
            Sistema de presença digital
          </p>
        </div>

        {/* LOGIN EMAIL */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          <Input
            label="E-mail"
            type="email"
            value={email}
            onChange={(e: any) =>
              setEmail(e.target.value)
            }
          />

          <Input
            label="Senha"
            type="password"
            value={senha}
            onChange={(e: any) =>
              setSenha(e.target.value)
            }
          />

          <Button onClick={entrar}>
            {carregando
              ? 'Entrando...'
              : 'Entrar'}
          </Button>
        </div>

        {/* DIVISOR */}
        <div
          style={{
            margin: '30px 0',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              flex: 1,
              height: 1,
              background: '#334155',
            }}
          />

          <span
            style={{
              color: '#94a3b8',
              fontSize: 14,
            }}
          >
            ou
          </span>

          <div
            style={{
              flex: 1,
              height: 1,
              background: '#334155',
            }}
          />
        </div>

        {/* MICROSOFT */}
        <button
          onClick={loginMicrosoft}
          style={{
            width: '100%',
            background: '#2563eb',
            border: 'none',
            padding: '16px',
            borderRadius: 18,
            color: 'white',
            fontWeight: 'bold',
            fontSize: 16,
            cursor: 'pointer',
            transition: '0.2s',
          }}
        >
          🏢 Entrar com Microsoft
        </button>

        {/* FOOTER */}
        <div
          style={{
            marginTop: 30,
            textAlign: 'center',
            color: '#64748b',
            fontSize: 13,
          }}
        >
          Azure Active Directory integrado
        </div>
      </div>
    </div>
  )
}