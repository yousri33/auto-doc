import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { DocStatus, Document } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDocStatus(expiryDateStr: string): DocStatus {
  const expiry = new Date(expiryDateStr)
  const today = new Date()
  const diff = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return 'expired'
  if (diff <= 7) return 'expiring'
  return 'valid'
}

export function calcComplianceScore(documents: Document[]): number {
  if (!documents.length) return 0
  const valid = documents.filter(d => getDocStatus(d.expiryDate) === 'valid').length
  return Math.round((valid / documents.length) * 100)
}

export function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

export function fmtDate(str: string, opts?: Intl.DateTimeFormatOptions): string {
  return new Date(str).toLocaleDateString('fr-DZ', opts ?? {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export function daysLeft(str: string): string {
  const diff = Math.ceil((new Date(str).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return `Expiré il y a ${Math.abs(diff)}j`
  if (diff === 0) return "Expire aujourd'hui"
  return `Expire dans ${diff}j`
}
