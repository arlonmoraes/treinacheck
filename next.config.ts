import type { NextConfig } from 'next'
import withPWAInit from '@ducanh2912/next-pwa'

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development', // Mantém o PWA desligado enquanto você programa no PC
})

const nextConfig: NextConfig = {
  devIndicators: false,
}

// Exporta a sua configuração original, mas agora "envelopada" pelo motor do PWA
export default withPWA(nextConfig)