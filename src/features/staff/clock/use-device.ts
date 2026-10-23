"use client"

import { useMemo } from "react"

import { DATA_SOURCE } from "@/lib/data"
import {
  simulatedCamera,
  simulatedLocation,
  webCamera,
  webLocation,
  type CameraProvider,
  type LocationProvider,
} from "@/lib/platform"

import { useDemoParam } from "../session/use-demo-param"
import { CLOCK_SIMS, simulatedFix, type ClockSim } from "./punch"

export type Device = {
  /** The active demo scenario, or null when the real GPS and camera are in use. */
  sim: ClockSim | null
  location: LocationProvider
  camera: CameraProvider
  /** True when a punch must be saved on the phone instead of sent now. */
  isOffline: () => boolean
}

type Venue = { lat: number; lng: number } | undefined

/**
 * The device the clock screens talk to. With the demo API the real GPS and camera are used; a
 * `?sim=` link (or the fixture-only static build, which has no venue to stand at) swaps in the
 * simulated ones. Must render under a Suspense boundary (it reads the URL).
 */
export function useDevice(venue: Venue, kind: "in" | "out"): Device {
  const demo = useDemoParam("sim", CLOCK_SIMS)
  const sim: ClockSim | null = demo ?? (DATA_SOURCE === "mock" ? "inside" : null)
  const lat = venue?.lat
  const lng = venue?.lng

  return useMemo<Device>(() => {
    if (!sim) {
      return {
        sim,
        location: webLocation,
        camera: webCamera,
        isOffline: () => typeof navigator !== "undefined" && !navigator.onLine,
      }
    }
    const fix =
      sim === "denied" || lat === undefined || lng === undefined
        ? null
        : simulatedFix(sim, { lat, lng }, kind)
    return {
      sim,
      location: simulatedLocation(fix),
      camera: simulatedCamera,
      isOffline: () => sim === "offline",
    }
  }, [sim, lat, lng, kind])
}
