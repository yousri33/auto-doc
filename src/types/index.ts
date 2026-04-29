export type DocStatus = 'valid' | 'expiring' | 'expired'

export interface Document {
  id: string
  type: string
  expiryDate: string
  uploadedAt: string
}

export interface Vehicle {
  id: string
  name: string
  plate: string
  type: string
  year: number
  color: string
  logo?: string
  documents: Document[]
}

export type Page = 'dashboard' | 'vehicles' | 'vehicle-detail' | 'reports' | 'upload'

export interface OcrResult {
  documentType: 'Assurance' | 'Carte Grise' | 'Contrôle Technique' | 'Vignette' | 'Autre'
  plate: string
  expiryDate: string
  confidence: number
  marque?: string
  chassis?: string
}
