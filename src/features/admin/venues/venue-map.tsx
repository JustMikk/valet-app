"use client"

import { useEffect, useRef } from "react"
import type * as Leaflet from "leaflet"
import type { Circle, Map as LeafletMap, Marker } from "leaflet"

import { cn } from "@/lib/utils"

type VenueMapProps = {
  lat: number
  lng: number
  /** The clock-in geofence, drawn as a circle around the pin. */
  radiusM: number
  /** Makes the pin draggable (to the exact valet stand) and reports where it was dropped. */
  onMove?: (lat: number, lng: number) => void
  /** Names the map for assistive tech. */
  label: string
  className?: string
}

const MAX_ZOOM = 19

type Layers = { L: typeof Leaflet; map: LeafletMap; marker: Marker; circle: Circle }

/** Frames the map on the venue so its whole clock-in circle is in view (works before first paint). */
function frame(L: typeof Leaflet, map: LeafletMap, lat: number, lng: number, radiusM: number) {
  map.fitBounds(L.latLng(lat, lng).toBounds(radiusM * 2), { padding: [28, 28], maxZoom: MAX_ZOOM })
}

/**
 * A real map (Leaflet, OpenStreetMap tiles) of one venue: its pin and clock-in circle, framed to
 * fit. Loaded in the browser only. The wheel doesn't zoom it, so scrolling the page never gets
 * trapped by the map.
 */
export function VenueMap({ lat, lng, radiusM, onMove, label, className }: VenueMapProps) {
  const host = useRef<HTMLDivElement>(null)
  const layers = useRef<Layers | null>(null)
  const latest = useRef({ lat, lng, radiusM, onMove })

  useEffect(() => {
    latest.current = { lat, lng, radiusM, onMove }
    const current = layers.current
    if (!current) return
    current.marker.setLatLng([lat, lng])
    current.marker.dragging?.[onMove ? "enable" : "disable"]()
    current.circle.setLatLng([lat, lng]).setRadius(radiusM)
    frame(current.L, current.map, lat, lng, radiusM)
  }, [lat, lng, radiusM, onMove])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const L = await import("leaflet")
      await import("leaflet/dist/leaflet.css")
      if (cancelled || !host.current) return
      const start = latest.current
      const map = L.map(host.current, { scrollWheelZoom: false, maxZoom: MAX_ZOOM })
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: MAX_ZOOM,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map)
      const circle = L.circle([start.lat, start.lng], {
        radius: start.radiusM,
        className: "venue-geofence",
      }).addTo(map)
      const marker = L.marker([start.lat, start.lng], {
        draggable: Boolean(start.onMove),
        keyboard: false,
        icon: L.divIcon({
          className: "",
          html: '<span class="venue-pin"></span>',
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        }),
      }).addTo(map)
      marker.on("dragend", () => {
        const at = marker.getLatLng()
        latest.current.onMove?.(at.lat, at.lng)
      })
      frame(L, map, start.lat, start.lng, start.radiusM)
      layers.current = { L, map, marker, circle }
    })()
    return () => {
      cancelled = true
      layers.current?.map.remove()
      layers.current = null
    }
  }, [])

  return (
    <div
      ref={host}
      role="application"
      aria-label={label}
      className={cn("relative isolate z-0 overflow-hidden rounded-r24 bg-surface", className)}
    />
  )
}
