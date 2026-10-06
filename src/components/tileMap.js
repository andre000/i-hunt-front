const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const ATTRIBUTION = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

export function openTileMap(element, options, onReady) {
  let cancelled = false
  let map = null
  import('leaflet').then(({ default: L }) => {
    if (cancelled || !element) return
    map = L.map(element, options)
    L.tileLayer(TILES, { attribution: ATTRIBUTION, maxZoom: 19, crossOrigin: '' }).addTo(map)
    map.attributionControl.setPrefix(false)
    onReady(L, map)
  })
  return () => {
    cancelled = true
    map?.remove()
  }
}
