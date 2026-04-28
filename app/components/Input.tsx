'use client'

export default function Input({ label, ...props }: any) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', marginBottom: 4 }}>
        {label}
      </label>
      <input
        {...props}
        style={{
          width: '100%',
          padding: 8,
          borderRadius: 6,
          border: '1px solid #ccc'
        }}
      />
    </div>
  )
}