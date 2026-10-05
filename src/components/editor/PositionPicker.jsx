/** @jsxImportSource @emotion/react */
import { useEffect, useRef } from 'react'
import { css } from '@emotion/react'
import PropTypes from 'prop-types'
import 'leaflet/dist/leaflet.css'

const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const ATTRIBUTION = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
const PIN = '<span class="picker__pin"></span>'

const isPoint = (position) => Number.isFinite(position?.lat) && Number.isFinite(position?.lng)

export function PositionPicker({ position, others, onPick }) {
  const element = useRef(null)
  const map = useRef(null)
  const marker = useRef(null)
  const leaflet = useRef(null)
  const pick = useRef(onPick)
  pick.current = onPick
  const place = useRef(null)
  const start = useRef({ position, others })

  useEffect(() => {
    let cancelled = false
    import('leaflet').then(({ default: L }) => {
      if (cancelled || !element.current) return
      leaflet.current = L
      map.current = L.map(element.current, { zoomControl: true })
      L.tileLayer(TILES, { attribution: ATTRIBUTION, maxZoom: 19, crossOrigin: '' }).addTo(map.current)
      map.current.attributionControl.setPrefix(false)
      map.current.on('click', ({ latlng }) => pick.current({ lat: latlng.lat, lng: latlng.lng }))

      const { position: first, others: nearby } = start.current
      const points = nearby.filter(isPoint).map(({ lat, lng }) => [lat, lng])
      if (isPoint(first)) map.current.setView([first.lat, first.lng], 15)
      else if (points.length > 0) map.current.fitBounds(points, { padding: [32, 32], maxZoom: 14 })
      else map.current.setView([0, 0], 2)
      place.current()
    })
    return () => {
      cancelled = true
      map.current?.remove()
      map.current = null
      marker.current = null
    }
  }, [])

  const lat = position?.lat
  const lng = position?.lng

  place.current = () => {
    const L = leaflet.current
    if (!L || !map.current) return
    if (!isPoint({ lat, lng })) {
      marker.current?.remove()
      marker.current = null
      return
    }
    if (!marker.current) {
      marker.current = L.marker([lat, lng], {
        icon: L.divIcon({ className: '', html: PIN, iconSize: [22, 22], iconAnchor: [11, 11] }),
        keyboard: false,
        interactive: false,
      }).addTo(map.current)
    } else {
      marker.current.setLatLng([lat, lng])
    }
    if (!map.current.getBounds().contains([lat, lng])) map.current.panTo([lat, lng])
  }

  useEffect(() => place.current(), [lat, lng])

  return <div ref={element} css={pickerStyle} className="editor__map" />
}

PositionPicker.propTypes = {
  position: PropTypes.shape({ lat: PropTypes.number, lng: PropTypes.number }),
  others: PropTypes.arrayOf(PropTypes.shape({ lat: PropTypes.number, lng: PropTypes.number })).isRequired,
  onPick: PropTypes.func.isRequired,
}

const pickerStyle = css`
  height: 280px;
  border: 1px solid var(--linha);
  border-radius: 12px;
  overflow: hidden;
  background-color: #111419;
  cursor: crosshair;

  .leaflet-container {
    cursor: crosshair;
  }

  .leaflet-tile-pane {
    filter: invert(1) hue-rotate(180deg) brightness(0.65) contrast(0.9) saturate(0.2);
  }

  .leaflet-control-attribution {
    background-color: rgb(12 14 17 / 70%);
    color: var(--apagado);
    font-size: 9px;

    a {
      color: var(--apagado);
    }
  }

  .picker__pin {
    display: block;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background-color: var(--laranja);
    box-shadow: 0 0 0 3px #111419, 0 0 0 5px var(--laranja);
  }
`
