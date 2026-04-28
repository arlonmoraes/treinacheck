'use client'

export default function Button({ children, onClick }: any) {
  return (
    <button
      onClick={onClick}
      style={{
        background: '#111827',
        color: 'white',
        padding: '10px 16px',
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer'
      }}
    >
      {children}
    </button>
  )
}