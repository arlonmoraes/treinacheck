'use client'

import Protegido from '@/app/components/Protegido'
import LayoutAdmin from '@/app/components/LayoutAdmin'

export default function Home() {
  return (
    <Protegido>
      <LayoutAdmin>
        <h1>Dashboard</h1>
        <p>Bem-vindo ao Minha Lista</p>
      </LayoutAdmin>
    </Protegido>
  )
}