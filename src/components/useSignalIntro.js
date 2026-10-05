import { useCallback, useLayoutEffect, useRef, useState } from 'react'

export const TIMELINE = {
  beacon: 250,
  waves: [500, 850, 1200],
  speed: 0.8,
  fadeOut: 1900,
  logo: 1900,
  end: 2700,
}

const LOGO_SCALE = 2.4
const FONT_WAIT_MS = 400

function prefersCalm() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? true
}

function introGeometry(main, logo, letter) {
  const box = main.getBoundingClientRect()
  const logoBox = logo.getBoundingClientRect()
  const letterBox = letter.getBoundingClientRect()
  const left = logoBox.left - box.left
  const top = logoBox.top - box.top
  const dx = (box.width - logoBox.width * LOGO_SCALE) / 2 - left
  const dy = box.height * 0.38 - (logoBox.height * LOGO_SCALE) / 2 - top
  const dotX = letterBox.left - box.left + letterBox.width / 2
  const dotY = letterBox.top - box.top + letterBox.height * 0.22
  return {
    transform: `translate(${dx}px, ${dy}px) scale(${LOGO_SCALE})`,
    origin: {
      x: left + dx + (dotX - left) * LOGO_SCALE,
      y: top + dy + (dotY - top) * LOGO_SCALE,
    },
  }
}

function flyLogo(logo, transform) {
  const settle = TIMELINE.logo / (TIMELINE.logo + 650)
  return logo.animate?.([
    { transform, opacity: 0, offset: 0 },
    { transform, opacity: 1, offset: 0.08 },
    { transform, opacity: 1, offset: settle, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    { transform: 'none', opacity: 1, offset: 1 },
  ], { duration: TIMELINE.logo + 650, fill: 'backwards' })
}

function fontsReady() {
  const ready = document.fonts?.ready ?? Promise.resolve()
  return Promise.race([ready, new Promise(resolve => setTimeout(resolve, FONT_WAIT_MS))])
}

export function useSignalIntro({ main, logo, letter }) {
  const logoAnimation = useRef(null)
  const skipped = useRef(false)
  const [intro, setIntro] = useState(null)
  const [done, setDone] = useState(false)

  useLayoutEffect(() => {
    if (prefersCalm()) {
      setIntro({ mode: 'calm' })
      setDone(true)
      return
    }
    let cancelled = false
    let timer = 0
    fontsReady().then(() => {
      if (cancelled) return
      const { transform, origin } = introGeometry(main.current, logo.current, letter.current)
      logoAnimation.current = flyLogo(logo.current, transform)
      setIntro({ mode: 'signal', origin, start: performance.now() })
      timer = setTimeout(() => setDone(true), TIMELINE.end)
    })
    return () => {
      cancelled = true
      clearTimeout(timer)
      logoAnimation.current?.cancel()
    }
  }, [main, logo, letter])

  const fallback = useCallback(() => {
    setIntro(current => current && { ...current, mode: 'fallback' })
  }, [])

  const skip = () => {
    if (done || !intro) return
    skipped.current = true
    logoAnimation.current?.finish()
    setDone(true)
  }

  const revealFrom = intro?.origin && !skipped.current
    ? { x: intro.origin.x, y: intro.origin.y, at: intro.start + TIMELINE.waves[2], speed: TIMELINE.speed }
    : undefined

  const stateClasses = [
    intro && `is-${intro.mode}`,
    done && 'is-done',
    skipped.current && 'is-skipped',
  ]

  return { intro, done, skipped, skip, fallback, revealFrom, stateClasses }
}
