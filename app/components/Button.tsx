type Props = {
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
}

export default function Button({
  children,
  onClick,
  type = 'button',
}: Props) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="
        w-full
        bg-blue-600
        hover:bg-blue-700
        transition-all
        p-3
        rounded-xl
        font-semibold
        text-white
        shadow-lg
      "
    >
      {children}
    </button>
  )
}