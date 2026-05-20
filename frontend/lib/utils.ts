import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDistance(metres: number): string {
  if (metres < 1000) return `${Math.round(metres)}m`
  return `${(metres / 1000).toFixed(1)}km`
}

export function formatSpeed(kmh: number, unit: 'kmh' | 'mph' = 'kmh'): string {
  if (unit === 'mph') return `${Math.round(kmh * 0.621371)} mph`
  return `${Math.round(kmh)} km/h`
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/** Haversine distance in metres */
export function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function volumeFromDistance(distance: number, radius: number, pinned: boolean): number {
  if (pinned) return 1
  if (distance >= radius) return 0
  return Math.max(0, 1 - distance / radius)
}

export function sanitizeDisplayName(name: string): string {
  return name.replace(/[<>&"'/]/g, '').trim().slice(0, 30)
}
