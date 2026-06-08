/* eslint-disable @next/next/no-img-element */

export default function Logo({ className = '', size = 96 }: { className?: string; size?: number }) {
  return (
    <img
      src="/logo.svg"
      alt="Tiara's de Crochê"
      height={size}
      className={className}
      style={{ height: size, width: 'auto', objectFit: 'contain' }}
    />
  )
}
