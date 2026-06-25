export function isValidIPv4(ip: string): boolean {
  const parts = ip.trim().split('.')
  if (parts.length !== 4) return false
  return parts.every((p) => /^\d{1,3}$/.test(p) && Number(p) >= 0 && Number(p) <= 255)
}

export function addOffset(ip: string, offset: number): string {
  const parts = ip.trim().split('.').map(Number)
  let value =
    (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3]
  value += offset
  return [
    (value >>> 24) & 255,
    (value >>> 16) & 255,
    (value >>> 8) & 255,
    value & 255,
  ].join('.')
}
