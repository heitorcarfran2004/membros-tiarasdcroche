'use client'

import { useEffect, useState } from 'react'

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

declare global {
  interface Window {
    __deferredInstallPrompt?: BIPEvent | null
  }
}

export default function InstallButton() {
  const [canInstall, setCanInstall] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [standalone, setStandalone] = useState(false)
  const [showIOSHelp, setShowIOSHelp] = useState(false)

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // iOS Safari
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    setStandalone(isStandalone)

    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as unknown as { MSStream?: unknown }).MSStream
    setIsIOS(iOS)

    // O evento pode ter sido capturado cedo pelo script inline no <head>.
    if (window.__deferredInstallPrompt) setCanInstall(true)

    const onBIP = (e: Event) => {
      e.preventDefault()
      window.__deferredInstallPrompt = e as BIPEvent
      setCanInstall(true)
    }
    const onInstalled = () => {
      window.__deferredInstallPrompt = null
      setCanInstall(false)
      setStandalone(true)
    }
    window.addEventListener('beforeinstallprompt', onBIP)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBIP)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  async function onClick() {
    if (isIOS) {
      setShowIOSHelp(true)
      return
    }
    const dp = window.__deferredInstallPrompt
    if (!dp) return
    await dp.prompt()
    await dp.userChoice.catch(() => {})
    window.__deferredInstallPrompt = null
    setCanInstall(false)
  }

  // Já instalado → não mostra nada
  if (standalone) return null
  // Android: só mostra quando o prompt está disponível. iOS: sempre (até instalar).
  if (!canInstall && !isIOS) return null

  return (
    <>
      <button
        onClick={onClick}
        className="rounded-lg bg-[var(--brand)] px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--brand-strong)]"
      >
        📲 Instalar App
      </button>

      {showIOSHelp && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={() => setShowIOSHelp(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-[var(--brand-strong)]">Instalar no iPhone/iPad</h3>
            <ol className="mt-3 space-y-2 text-sm text-[var(--foreground)]">
              <li>1. Toque no botão <strong>Compartilhar</strong> <span aria-hidden>⎋</span> na barra do Safari.</li>
              <li>2. Role e toque em <strong>Adicionar à Tela de Início</strong> <span aria-hidden>➕</span>.</li>
              <li>3. Toque em <strong>Adicionar</strong>. Pronto! 🎉</li>
            </ol>
            <button
              onClick={() => setShowIOSHelp(false)}
              className="mt-4 w-full rounded-xl bg-[var(--brand)] px-4 py-2.5 font-semibold text-white"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  )
}
