import { x25519 } from '@noble/curves/ed25519.js'

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary)
}

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return bytes
}

// WireGuard clamps the raw random scalar before using it as a Curve25519
// private key (same as `wg genkey`), so the exported value matches what
// MikroTik/wg-quick expect.
function clamp(privateKey: Uint8Array): Uint8Array {
  privateKey[0] &= 248
  privateKey[31] &= 127
  privateKey[31] |= 64
  return privateKey
}

export interface KeyPair {
  privateKey: string
  publicKey: string
}

export function generateKeyPair(): KeyPair {
  const privateKey = clamp(randomBytes(32))
  const publicKey = x25519.getPublicKey(privateKey)
  return {
    privateKey: toBase64(privateKey),
    publicKey: toBase64(publicKey),
  }
}

export function generatePresharedKey(): string {
  return toBase64(randomBytes(32))
}
