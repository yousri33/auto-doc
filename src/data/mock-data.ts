import { daysFromNow } from '@/lib/utils'
import type { Vehicle, OcrResult } from '@/types'

export const MOCK_VEHICLES: Vehicle[] = [
  {
    id: 'v1',
    name: 'Peugeot Partner',
    plate: '018197-125-16',
    type: 'Van',
    year: 2020,
    color: '#4a90d9',
    logo: '/peugeot.png',
    documents: [
      { id: 'd1', type: 'Assurance', expiryDate: daysFromNow(120), uploadedAt: '2025-01-10' },
      { id: 'd2', type: 'Carte Grise', expiryDate: daysFromNow(400), uploadedAt: '2025-01-10' },
      { id: 'd3', type: 'Contrôle Technique', expiryDate: daysFromNow(5), uploadedAt: '2025-01-10' },
    ],
  },
  {
    id: 'v2',
    name: 'Renault Kangoo',
    plate: '008234-119-16',
    type: 'Van',
    year: 2019,
    color: '#e8854a',
    logo: '/renault.png',
    documents: [
      { id: 'd4', type: 'Assurance', expiryDate: daysFromNow(-10), uploadedAt: '2024-12-01' },
      { id: 'd5', type: 'Carte Grise', expiryDate: daysFromNow(200), uploadedAt: '2024-12-01' },
      { id: 'd6', type: 'Contrôle Technique', expiryDate: daysFromNow(3), uploadedAt: '2024-12-01' },
    ],
  },
  {
    id: 'v3',
    name: 'Toyota Hilux',
    plate: '112345-321-16',
    type: 'Truck',
    year: 2021,
    color: '#5cb85c',
    logo: '/toyota.png',
    documents: [
      { id: 'd7', type: 'Assurance', expiryDate: daysFromNow(180), uploadedAt: '2025-02-14' },
      { id: 'd8', type: 'Carte Grise', expiryDate: daysFromNow(365), uploadedAt: '2025-02-14' },
      { id: 'd9', type: 'Contrôle Technique', expiryDate: daysFromNow(90), uploadedAt: '2025-02-14' },
    ],
  },
  {
    id: 'v4',
    name: 'Mercedes Sprinter',
    plate: '005543-118-31',
    type: 'Heavy Van',
    year: 2018,
    color: '#9b59b6',
    logo: '/mercedes.png',
    documents: [
      { id: 'd10', type: 'Assurance', expiryDate: daysFromNow(-3), uploadedAt: '2024-11-20' },
      { id: 'd11', type: 'Carte Grise', expiryDate: daysFromNow(500), uploadedAt: '2024-11-20' },
      { id: 'd12', type: 'Contrôle Technique', expiryDate: daysFromNow(-15), uploadedAt: '2024-11-20' },
    ],
  },
  {
    id: 'v5',
    name: 'Volkswagen Crafter',
    plate: '012233-122-02',
    type: 'Heavy Van',
    year: 2022,
    color: '#3498db',
    logo: '/volkswagen.png',
    documents: [
      { id: 'd13', type: 'Assurance', expiryDate: daysFromNow(280), uploadedAt: '2025-03-01' },
      { id: 'd14', type: 'Carte Grise', expiryDate: daysFromNow(600), uploadedAt: '2025-03-01' },
      { id: 'd15', type: 'Contrôle Technique', expiryDate: daysFromNow(6), uploadedAt: '2025-03-01' },
    ],
  },
  {
    id: 'v6',
    name: 'Mitsubishi L200',
    plate: '099887-321-13',
    type: 'Truck',
    year: 2021,
    color: '#34495e',
    logo: '/mitsubishi.png',
    documents: [
      { id: 'd16', type: 'Assurance', expiryDate: daysFromNow(150), uploadedAt: '2025-01-20' },
    ],
  },
  {
    id: 'v7',
    name: 'Iveco Daily',
    plate: '003344-117-35',
    type: 'Heavy Van',
    year: 2017,
    color: '#f1c40f',
    logo: '/iveco.png',
    documents: [
      { id: 'd17', type: 'Contrôle Technique', expiryDate: daysFromNow(-20), uploadedAt: '2024-10-15' },
    ],
  },
  {
    id: 'v8',
    name: 'Volkswagen Crafter',
    plate: '012233-122-02',
    type: 'Heavy Van',
    year: 2020,
    color: '#2980b9',
    logo: '/volkswagen.png',
    documents: [
      { id: 'd18', type: 'Assurance', expiryDate: daysFromNow(10), uploadedAt: '2025-04-15' },
    ],
  },
]

export const WEBHOOK_URL = 'https://n8n.srv1231456.hstgr.cloud/webhook/auto-doc'

export async function extractDocumentData(_file: File): Promise<OcrResult> {
  await new Promise(r => setTimeout(r, 1800))
  const mocks: OcrResult[] = [
    { documentType: 'Assurance', expiryDate: daysFromNow(180), plate: '018197-125-16', confidence: 91 },
    { documentType: 'Contrôle Technique', expiryDate: daysFromNow(42), plate: '31 445-D-06', confidence: 87 },
    { documentType: 'Carte Grise', expiryDate: daysFromNow(365), plate: '09 102-C-06', confidence: 94 },
  ]
  return mocks[Math.floor(Math.random() * mocks.length)]
}
