import { useEffect, useState } from 'react'

const DESKTOP_WIDTH = 960

export function useDesktopWidth() {
  const [wide, setWide] = useState(() => window.innerWidth >= DESKTOP_WIDTH)

  useEffect(() => {
    const onResize = () => setWide(window.innerWidth >= DESKTOP_WIDTH)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return wide
}
