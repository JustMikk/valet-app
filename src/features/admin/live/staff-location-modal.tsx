"use client"

import { useEffect, useRef, useState } from "react"
import type * as Leaflet from "leaflet"
import type { Map as LeafletMap, Marker } from "leaflet"

import { Icon } from "@/components/shared"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { LiveSlot } from "@/lib/data/admin/ops-schemas"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Minimal staff-pin map (no geofence circle, no drag)
// ---------------------------------------------------------------------------

const MAX_ZOOM = 19
const DEFAULT_ZOOM = 16

type PinMapProps = { lat: number; lng: number; name: string; className?: string }

function PinMap({ lat, lng, name, className }: PinMapProps) {
  const host = useRef<HTMLDivElement>(null)
  const layers = useRef<{ L: typeof Leaflet; map: LeafletMap; marker: Marker } | null>(null)
  const latest = useRef({ lat, lng })

  useEffect(() => {
    latest.current = { lat, lng }
    if (!layers.current) return
    layers.current.marker.setLatLng([lat, lng])
    layers.current.map.setView([lat, lng], DEFAULT_ZOOM)
  }, [lat, lng])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const L = await import("leaflet")
      await import("leaflet/dist/leaflet.css")
      if (cancelled || !host.current) return
      const { lat: startLat, lng: startLng } = latest.current
      const map = L.map(host.current, { scrollWheelZoom: false, maxZoom: MAX_ZOOM })
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: MAX_ZOOM,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map)
      const marker = L.marker([startLat, startLng], {
        keyboard: false,
        icon: L.divIcon({
          className: "",
          html: '<span class="venue-pin"></span>',
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        }),
      }).addTo(map)
      map.setView([startLat, startLng], DEFAULT_ZOOM)
      layers.current = { L, map, marker }
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
      aria-label={`${name}'s location`}
      className={cn("relative isolate z-0 overflow-hidden rounded-r16 bg-surface-2", className)}
    />
  )
}

// ---------------------------------------------------------------------------
// Reverse geocode via Nominatim (OSM) — best-effort, no error shown
// ---------------------------------------------------------------------------

async function reverseName(lat: number, lng: number): Promise<string | null> {
  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}` +
      `&format=json&zoom=16&addressdetails=0`
    const res = await fetch(url, { headers: { "Accept-Language": "en" } })
    if (!res.ok) return null
    const json = (await res.json()) as { display_name?: string }
    return json.display_name ?? null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// The modal
// ---------------------------------------------------------------------------

type Props = {
  slot: LiveSlot | null
  open: boolean
  onClose: () => void
}

export function StaffLocationModal({ slot, open, onClose }: Props) {
  const [placeName, setPlaceName] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !slot?.lat || !slot?.lng) return
    let alive = true
    void reverseName(slot.lat, slot.lng).then((name) => {
      if (alive) setPlaceName(name)
    })
    return () => {
      alive = false
      setPlaceName(null)
    }
  }, [open, slot])

  if (!slot) return null

  const hasLocation = typeof slot.lat === "number" && typeof slot.lng === "number"

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose()
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-17 font-bold">{slot.name}</DialogTitle>
          <p className="m-0 text-13 text-fg-3">{slot.meta}</p>
        </DialogHeader>

        {/* Selfie — rendered as a background-image div to avoid the no-img-element rule */}
        <div className="flex justify-center">
          {slot.selfieUrl ? (
            <span
              role="img"
              aria-label={`${slot.name} clock-in selfie`}
              style={{ backgroundImage: `url(${slot.selfieUrl})` }}
              className="h-40 w-32 rounded-r20 bg-cover bg-center shadow-sm"
            />
          ) : (
            <span className="grid h-32 w-28 place-items-center rounded-r20 bg-surface-2 text-fg-3">
              <Icon name="face" size={40} />
            </span>
          )}
        </div>

        {/* Map */}
        {hasLocation ? (
          <div className="flex flex-col gap-1.5">
            <PinMap
              lat={slot.lat as number}
              lng={slot.lng as number}
              name={slot.name}
              className="h-44 w-full"
            />
            {placeName && (
              <p className="m-0 flex items-start gap-1.5 text-13 text-fg-2">
                <Icon name="location_on" size={15} className="mt-0.5 shrink-0 text-accent-text" />
                {placeName}
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-r12 bg-surface-2 px-3.5 py-3 text-14 text-fg-2">
            <Icon name="location_off" size={18} />
            Location not available for this clock-in
          </div>
        )}

        <DialogClose
          className="absolute top-3.5 right-3.5 grid size-8 place-items-center rounded-full text-fg-3 hover:bg-surface-2"
          aria-label="Close"
        >
          <Icon name="close" size={20} />
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}
