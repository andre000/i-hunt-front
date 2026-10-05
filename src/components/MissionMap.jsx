/** @jsxImportSource @emotion/react */
import { useEffect, useRef } from 'react'
import { css } from '@emotion/react'
import PropTypes from 'prop-types'
import 'leaflet/dist/leaflet.css'

const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const ATTRIBUTION = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

function markerHtml(mission, selected) {
  const classes = ['pin', `pin--${mission.status}`, selected && 'pin--selected'].filter(Boolean).join(' ')
  return `<span class="${classes}"><span class="pin__pulse"></span><span class="pin__dot"></span></span>`
}

export function MissionMap({ missions, selectedId, onSelect, interactive = true, zoom, className }) {
  const element = useRef(null)
  const map = useRef(null)
  const layer = useRef(null)
  const leaflet = useRef(null)
  const select = useRef(onSelect)
  select.current = onSelect
  const draw = useRef(null)

  useEffect(() => {
    let cancelled = false
    import('leaflet').then(({ default: L }) => {
      if (cancelled || !element.current) return
      leaflet.current = L
      map.current = L.map(element.current, {
        zoomControl: false,
        attributionControl: true,
        dragging: interactive,
        scrollWheelZoom: interactive,
        doubleClickZoom: interactive,
        touchZoom: interactive,
        keyboard: interactive,
      })
      L.tileLayer(TILES, { attribution: ATTRIBUTION, maxZoom: 19 }).addTo(map.current)
      map.current.attributionControl.setPrefix(false)
      layer.current = L.layerGroup().addTo(map.current)
      draw.current()
    })
    return () => {
      cancelled = true
      map.current?.remove()
      map.current = null
    }
  }, [interactive])

  const markersKey = `${selectedId}|${missions.map(m => `${m.id}:${m.status}:${m.position.lat},${m.position.lng}`).join('|')}`
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(drawMarkers, [markersKey])

  draw.current = drawMarkers

  function drawMarkers() {
    const L = leaflet.current
    if (!L || !map.current) return
    layer.current.clearLayers()
    const points = missions.map(mission => {
      const point = [mission.position.lat, mission.position.lng]
      const marker = L.marker(point, {
        icon: L.divIcon({ className: '', html: markerHtml(mission, mission.id === selectedId), iconSize: [28, 28], iconAnchor: [14, 14] }),
        title: mission.name,
        keyboard: interactive,
        interactive,
        zIndexOffset: mission.id === selectedId ? 1000 : 0,
      })
      marker.on('click', () => select.current?.(mission.id))
      marker.addTo(layer.current)
      return point
    })
    const selected = missions.find(mission => mission.id === selectedId)
    if (zoom && selected) {
      map.current.setView([selected.position.lat, selected.position.lng], zoom)
    } else if (points.length > 0) {
      map.current.fitBounds(points, { padding: [48, 48], maxZoom: 15 })
    }
  }

  return <div ref={element} css={mapStyle} className={className} aria-hidden={!interactive} />
}

MissionMap.propTypes = {
  missions: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    position: PropTypes.shape({ lat: PropTypes.number.isRequired, lng: PropTypes.number.isRequired }).isRequired,
  })).isRequired,
  selectedId: PropTypes.string,
  onSelect: PropTypes.func,
  interactive: PropTypes.bool,
  zoom: PropTypes.number,
  className: PropTypes.string,
}

const mapStyle = css`
  background-color: #111419;
  font-family: var(--sans);

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

  .pin {
    position: relative;
    display: block;
    width: 28px;
    height: 28px;
    --pin: var(--apagado);
  }

  .pin--available { --pin: var(--laranja); }
  .pin--in-progress { --pin: var(--texto); }
  .pin--completed { --pin: var(--ok); }
  .pin--failed { --pin: var(--perigo); }

  .pin__dot {
    position: absolute;
    inset: 8px;
    border-radius: 50%;
    background-color: var(--pin);
    box-shadow: 0 0 0 3px #111419;
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .pin--in-progress .pin__dot {
    background-color: var(--asfalto);
    box-shadow: 0 0 0 3px var(--texto), 0 0 0 6px #111419;
  }

  .pin--selected .pin__dot {
    transform: scale(1.5);
  }

  .pin__pulse {
    display: none;
    position: absolute;
    inset: -14px;
    border-radius: 50%;
    background-color: var(--pin);
    opacity: 0;
  }

  .pin--available .pin__pulse {
    display: block;
    animation: pin-pulse 2.4s cubic-bezier(0.16, 1, 0.3, 1) infinite;
  }

  @keyframes pin-pulse {
    from { transform: scale(0.3); opacity: 0.55; }
    to { transform: scale(1); opacity: 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    .pin--available .pin__pulse {
      animation: none;
      opacity: 0.18;
    }
  }
`
