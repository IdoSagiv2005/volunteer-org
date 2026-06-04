'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default marker icons
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

type AddressPoint = { id: string; address: string; family?: string }
type GeoPoint = { id: string; lat: number; lng: number; address: string; family?: string }

async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`)
    const data = await res.json()
    if (data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch {}
  return null
}

export default function DeliveryMap({ addresses }: { addresses: AddressPoint[] }) {
  const [points, setPoints] = useState<GeoPoint[]>([])

  useEffect(() => {
    async function loadPoints() {
      const results: GeoPoint[] = []
      for (const a of addresses) {
        const geo = await geocode(a.address)
        if (geo) results.push({ ...a, ...geo })
      }
      setPoints(results)
    }
    loadPoints()
  }, [addresses])

  const center: [number, number] = points.length > 0
    ? [points[0].lat, points[0].lng]
    : [31.7683, 35.2137] // Default: Jerusalem

  return (
    <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap contributors" />
      {points.map(p => (
        <Marker key={p.id} position={[p.lat, p.lng]}>
          <Popup>
            <strong>{p.family}</strong><br />{p.address}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
