import { useLayoutEffect, useRef, useState } from 'react'
import AppLayout from '../layouts/AppLayout'

function RollerMapFrame({ admin }) {
  const frameRef = useRef(null)
  const measureRef = useRef(() => {})
  const [height, setHeight] = useState(320)
  useLayoutEffect(() => {
    const frame = frameRef.current
    const nav = document.querySelector('.app-shell nav')
    const header = document.querySelector('.app-shell header')
    const measure = () => {
      const viewportBottom = window.visualViewport ? window.visualViewport.offsetTop + window.visualViewport.height : window.innerHeight
      const bottom = nav ? Math.min(nav.getBoundingClientRect().top - 34, viewportBottom) : viewportBottom
      setHeight(Math.max(120, Math.floor(bottom - frame.getBoundingClientRect().top)))
    }
    measureRef.current = measure
    const observer = new ResizeObserver(measure)
    if (header) observer.observe(header)
    if (nav) observer.observe(nav)
    measure()
    window.addEventListener('resize', measure)
    window.visualViewport?.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
      window.visualViewport?.removeEventListener('resize', measure)
      measureRef.current = () => {}
    }
  }, [])
  return <iframe ref={frameRef} onLoad={() => measureRef.current()} title={admin ? 'Administración de RollerMap' : 'Mapa de escuelas y grupos de patinaje'} src={admin ? '/rollermap/admin' : '/rollermap/'} allow="geolocation" style={{ display: 'block', width: '100%', height, border: 0 }} />
}

export default function RollerMap({ admin = false }) {
  return <AppLayout title={admin ? 'Administrar RollerMap' : 'RollerMap'} showBack><RollerMapFrame admin={admin} /></AppLayout>
}
