// A built PDF as base64, to send it in a JSON body (the invoice email's attachment, ADR-027).

/** Bytes per String.fromCharCode call: well under any engine's argument limit. */
const CHUNK = 0x8000

export function toBase64(bytes: Uint8Array): string {
  let binary = ""
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(binary)
}
