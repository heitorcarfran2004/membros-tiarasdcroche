'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    // SW propositalmente SEM cache/fetch interceptado (handler de fetch vazio),
    // para não quebrar o 1º carregamento em rede de celular instável.
    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).catch(() => {})
  }, [])
  return null
}
