import { useState, useRef, useEffect } from 'react'
import { Upload as UploadIcon, Scan, CheckCircle, X, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/layout/PageHeader'
import { Spinner } from '@/components/Spinner'
import { extractDocumentData, WEBHOOK_URL } from '@/data/mock-data'
import type { Vehicle, Page, OcrResult } from '@/types'

interface UploadProps {
  vehicles: Vehicle[]
  setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>
  setPage: (p: Page) => void
}

const DOC_TYPES = ['Assurance', 'Carte Grise', 'Contrôle Technique', 'Vignette', 'Autre']

const OCR_STEPS = [
  'Détection du document…',
  'Lecture des champs…',
  'Extraction de la date…',
  'Identification du véhicule…',
]

function OcrSteps() {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setStep(s => (s + 1) % OCR_STEPS.length), 420)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="flex flex-col gap-1 items-center">
      {OCR_STEPS.map((s, i) => (
        <div
          key={s}
          className="text-xs transition-all"
          style={{
            opacity: i <= step ? 1 : 0.25,
            fontWeight: i === step ? 600 : 400,
            color: i === step ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
          }}
        >
          {s}
        </div>
      ))}
    </div>
  )
}

export function Upload({ vehicles, setVehicles, setPage }: UploadProps) {
  const [dragOver, setDragOver]         = useState(false)
  const [file, setFile]                 = useState<File | null>(null)
  const [loading, setLoading]           = useState(false)
  const [ocrResult, setOcrResult]       = useState<OcrResult | null>(null)
  const [editedResult, setEditedResult] = useState<OcrResult | null>(null)
  const [saved, setSaved]               = useState(false)
  const inputRef                        = useRef<HTMLInputElement>(null)

  async function handleFile(f: File) {
    setFile(f); setOcrResult(null); setSaved(false); setLoading(true)
    try {
      const result = await extractDocumentData(f)
      setOcrResult(result)
      setEditedResult({ ...result })
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  function handleConfirm() {
    if (!editedResult) return
    setVehicles(prev => prev.map(v => {
      if (v.plate.replace(/\s/g, '') === editedResult.plate.replace(/\s/g, '')) {
        const newDoc = {
          id: 'doc_' + Date.now(),
          type: editedResult.documentType,
          expiryDate: editedResult.expiryDate,
          uploadedAt: new Date().toISOString().split('T')[0],
        }
        const docs = [...v.documents]
        const idx = docs.findIndex(d => d.type === editedResult.documentType)
        if (idx >= 0) docs[idx] = newDoc; else docs.push(newDoc)
        return { ...v, documents: docs }
      }
      return v
    }))
    fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'document_approved',
        plate: editedResult.plate,
        documentType: editedResult.documentType,
        expiryDate: editedResult.expiryDate,
        confidence: ocrResult?.confidence,
        approvedBy: 'Hadji Khaoula',
        approvedAt: new Date().toISOString(),
      }),
    }).catch(() => {})
    setSaved(true)
  }

  function reset() {
    setFile(null); setOcrResult(null); setEditedResult(null); setSaved(false); setLoading(false)
  }

  const matchedVehicle = editedResult
    ? vehicles.find(v => v.plate.replace(/\s/g, '') === editedResult.plate.replace(/\s/g, ''))
    : null

  return (
    <div className="pb-12">
      <PageHeader title="Upload & OCR" subtitle="Importez un document — les données sont extraites automatiquement" />

      <div className="mt-5 mx-7 grid grid-cols-[1fr_1fr] gap-4 max-w-[880px]">
        {/* Drop zone column */}
        <div className="flex flex-col gap-3">
          <Card className="overflow-hidden">
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => !file && inputRef.current?.click()}
              className="m-3 rounded-md border-2 border-dashed text-center transition-all min-h-[200px] flex flex-col items-center justify-center gap-3"
              style={{
                borderColor: dragOver ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                background: dragOver ? 'hsl(var(--primary)/0.04)' : 'hsl(var(--muted)/0.3)',
                cursor: file ? 'default' : 'pointer',
              }}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
              />

              {!file ? (
                <>
                  <div className="w-13 h-13 rounded-xl bg-primary/10 flex items-center justify-center text-primary" style={{ width: 52, height: 52 }}>
                    <UploadIcon size={24} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Glissez votre fichier ici</p>
                    <p className="text-[13px] text-muted-foreground mt-1">
                      ou <span className="text-primary font-medium">cliquez pour parcourir</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-2">PNG, JPG, PDF · max 10 Mo</p>
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="rounded-xl flex items-center justify-center"
                    style={{
                      width: 52, height: 52,
                      background: saved ? 'hsl(var(--status-valid-bg))' : 'hsl(var(--primary)/0.1)',
                      color: saved ? 'hsl(var(--status-valid))' : 'hsl(var(--primary))',
                    }}
                  >
                    {loading ? <Spinner size={24} /> : saved ? <CheckCircle size={24} /> : <UploadIcon size={24} />}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{file.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {loading ? 'Analyse OCR en cours…' : saved ? 'Enregistré avec succès' : 'Fichier chargé — vérifiez les données'}
                    </p>
                  </div>
                  {!loading && (
                    <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); reset() }}>
                      Nouveau document
                    </Button>
                  )}
                </>
              )}
            </div>
          </Card>

          {/* OCR info */}
          <Card>
            <CardContent className="p-3.5 flex gap-3 items-start">
              <Scan size={16} className="text-primary mt-px shrink-0" />
              <div>
                <p className="font-semibold text-[13px] mb-1">Moteur OCR</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Extraction automatique par reconnaissance optique. Prêt pour intégration{' '}
                  <strong>Google Vision API</strong>. Vérifiez toujours les données avant de confirmer.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Result panel */}
        <div>
          {!ocrResult && !loading && (
            <Card className="min-h-[260px] flex items-center justify-center">
              <div className="text-center p-8">
                <Scan size={40} className="text-border mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Les données extraites apparaîtront ici</p>
                <p className="text-xs text-muted-foreground mt-1">Importez un document pour commencer</p>
              </div>
            </Card>
          )}

          {loading && (
            <Card className="min-h-[260px] flex items-center justify-center">
              <div className="text-center p-8 flex flex-col items-center gap-4">
                <Spinner size={36} />
                <div>
                  <p className="font-semibold text-sm">Analyse en cours…</p>
                  <p className="text-[13px] text-muted-foreground mt-1">Extraction des données du document</p>
                </div>
                <OcrSteps />
              </div>
            </Card>
          )}

          {ocrResult && editedResult && !saved && (
            <Card>
              <CardHeader className="px-5 pt-4 pb-0">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Scan size={15} className="text-primary" />
                    Données détectées
                  </CardTitle>
                  <Badge variant={ocrResult.confidence >= 85 ? 'success' : ocrResult.confidence >= 70 ? 'warning' : 'error'}>
                    {ocrResult.confidence}% confiance
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="px-5 py-4">
                {/* Confidence bar */}
                <div className="mb-4 p-3 rounded-md bg-muted/50 border border-border">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">Score de confiance OCR</span>
                    <span
                      className="font-bold"
                      style={{ color: ocrResult.confidence >= 85 ? 'hsl(var(--status-valid))' : 'hsl(var(--status-expiring))' }}
                    >
                      {ocrResult.confidence}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${ocrResult.confidence}%`,
                        background: ocrResult.confidence >= 85 ? 'hsl(var(--status-valid))' : 'hsl(var(--status-expiring))',
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    {ocrResult.confidence >= 85 ? '✓ Haute précision — données fiables' : '⚠ Précision moyenne — vérifiez les données'}
                  </p>
                </div>

                {/* Editable fields */}
                <div className="flex flex-col gap-3.5">
                  <div>
                    <label className="text-xs font-medium block mb-1.5">Type de document</label>
                    <Select
                      value={editedResult.documentType}
                      onValueChange={v => setEditedResult({ ...editedResult, documentType: v })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DOC_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-medium block mb-1.5">Date d'expiration</label>
                    <input
                      type="date"
                      value={editedResult.expiryDate}
                      onChange={e => setEditedResult({ ...editedResult, expiryDate: e.target.value })}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium block mb-1.5">Plaque d'immatriculation</label>
                    <input
                      type="text"
                      value={editedResult.plate}
                      onChange={e => setEditedResult({ ...editedResult, plate: e.target.value })}
                      placeholder="ex: 16 234-A-06"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    {matchedVehicle ? (
                      <p className="text-[11px] text-status-valid mt-1 font-medium">
                        ✓ Véhicule trouvé: {matchedVehicle.name}
                      </p>
                    ) : (
                      <p className="text-[11px] text-status-expiring mt-1">
                        Aucun véhicule correspondant — le document sera ignoré
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>

              <Separator />

              <CardFooter className="px-5 py-3.5 gap-2">
                <Button
                  className="flex-1 justify-center"
                  onClick={handleConfirm}
                  disabled={!matchedVehicle}
                >
                  <Check size={14} /> Confirmer & Enregistrer
                </Button>
                <Button variant="outline" onClick={reset}>
                  <X size={14} /> Annuler
                </Button>
              </CardFooter>
            </Card>
          )}

          {saved && editedResult && (
            <Card className="border-status-valid-border" style={{ background: 'hsl(var(--status-valid-bg))' }}>
              <CardContent className="py-9 px-6 text-center flex flex-col items-center gap-3.5">
                <div className="w-13 h-13 rounded-full bg-white border-2 border-status-valid flex items-center justify-center text-status-valid" style={{ width: 52, height: 52 }}>
                  <CheckCircle size={26} />
                </div>
                <div>
                  <p className="font-bold text-base">Document enregistré</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {editedResult.documentType} · {editedResult.plate}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setPage('vehicles')}>Voir les véhicules</Button>
                  <Button variant="outline" onClick={reset}>Nouveau upload</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
