type Props = {
  label: string
  type?: string
  value: any
  onChange: any
}

export default function Input({
  label,
  type = 'text',
  value,
  onChange,
}: Props) {
  return (
    <div className="mb-4">
      <label className="block mb-2 text-sm text-slate-300">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={onChange}
        className="
          w-full
          bg-slate-800
          border
          border-slate-700
          rounded-xl
          p-3
          text-white
          outline-none
          focus:border-blue-500
        "
      />
    </div>
  )
}