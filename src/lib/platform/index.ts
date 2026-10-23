export { webCamera } from "./camera.web"
export { webLocation } from "./location.web"
export { webPush } from "./push.web"
export { simulatedCamera, simulatedLocation, unsupportedPush } from "./simulated"
export type {
  AcquireOptions,
  CameraFailure,
  CameraOutcome,
  CameraProvider,
  CameraSession,
  GeoFix,
  LocationFailure,
  LocationOutcome,
  LocationProvider,
  PushFailure,
  PushOutcome,
  PushPermission,
  PushProvider,
  PushSubscriptionData,
} from "./types"
