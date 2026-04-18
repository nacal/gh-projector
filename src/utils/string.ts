import stringWidth from 'string-width'

export function displayWidth(s: string): number {
  return stringWidth(s)
}

export function padEnd(s: string, width: number): string {
  const w = displayWidth(s)
  if (w >= width) return sliceByWidth(s, width)
  return s + ' '.repeat(width - w)
}

export function sliceByWidth(s: string, maxWidth: number): string {
  let w = 0
  let i = 0
  for (const char of s) {
    const cw = displayWidth(char)
    if (w + cw > maxWidth) break
    w += cw
    i += char.length
  }
  const sliced = s.slice(0, i)
  const remaining = maxWidth - displayWidth(sliced)
  return remaining > 0 ? sliced + ' '.repeat(remaining) : sliced
}

export function truncateByWidth(s: string, maxWidth: number): string {
  if (maxWidth <= 0) return ''
  const w = displayWidth(s)
  if (w <= maxWidth) return s
  if (maxWidth <= 1) return sliceByWidth(s, 1)
  return `${sliceByWidth(s, maxWidth - 1)}…`
}
