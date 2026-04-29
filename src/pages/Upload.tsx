import { useState, useRef, useEffect } from 'react'
import { Upload as UploadIcon, Scan, CheckCircle, X, Check, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/layout/PageHeader'
import { Spinner } from '@/components/Spinner'
import { performOcr } from '@/lib/gemini'
import { WEBHOOK_URL } from '@/data/mock-data'
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

const SUPPORTED_LOGOS = ['peugeot', 'volkswagen', 'renault', 'toyota', 'bmw', 'dongfeng', 'fiat', 'foton', 'freightliner', 'iveco', 'kia', 'lada', 'man', 'mercedes', 'mitsubishi', 'nissan', 'opel'];

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
      const result = await performOcr(f)
      setOcrResult(result)
      setEditedResult({ ...result })
    } catch (e: any) { 
      console.error("OCR Failed:", e)
      alert(`Erreur d'analyse : ${e.message || "Vérifiez votre connexion ou clé API"}`)
    }
    setLoading(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false)
    const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain')
    
    // If dragging from showcase
    if (url && url.includes('mock-')) {
      const filename = url.split('/').pop() || 'demo.png'
      fetch(url)
        .then(r => r.blob())
        .then(b => handleFile(new File([b], filename, { type: 'image/png' })))
      return
    }

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

      <div className="mt-5 mx-7 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 max-w-[1200px]">
        {/* Left Section: Dropzone + Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Drop zone column */}
          <div className="flex flex-col gap-3">
            <Card className="overflow-hidden">
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => !file && inputRef.current?.click()}
                className="m-3 rounded-md border-2 border-dashed text-center transition-all min-h-[200px] flex flex-col items-center justify-center gap-3 relative"
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

                {file && !saved && (
                  <div className="absolute inset-0 z-0 opacity-10 blur-[2px] overflow-hidden">
                    <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="relative z-10 flex flex-col items-center justify-center gap-3 w-full h-full py-8">
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
                      {loading && (
                        <motion.div 
                          initial={{ top: 0 }}
                          animate={{ top: '100%' }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                          className="absolute left-0 right-0 h-0.5 bg-primary shadow-[0_0_15px_rgba(16,185,129,0.8)] z-20"
                        />
                      )}
                      <div className="rounded-xl flex items-center justify-center relative overflow-hidden bg-white/50 border border-border shadow-sm" style={{ width: 80, height: 80 }}>
                        {file.type.startsWith('image/') ? (
                          <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <UploadIcon size={24} className="text-primary" />
                        )}
                        {loading && (
                          <div className="absolute inset-0 bg-primary/20 backdrop-blur-[1px] flex items-center justify-center">
                            <Scan size={32} className="text-white animate-pulse" />
                          </div>
                        )}
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-sm truncate max-w-[180px]">{file.name}</p>
                        <p className="text-[11px] text-muted-foreground mt-1 uppercase tracking-wider font-medium">
                          {loading ? 'Analyse Gemini AI…' : saved ? 'Enregistré' : 'Prêt'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Card>

            <Card>
              <CardContent className="p-3.5 flex gap-3 items-start">
                <Scan size={16} className="text-primary mt-px shrink-0" />
                <div>
                  <p className="font-semibold text-[13px] mb-1">Google Gemini AI</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Extraction intelligente par <strong>Gemini 2.0 Flash</strong>. 
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Result Panel */}
          <div>
            {!ocrResult && !loading && (
              <Card className="h-full flex items-center justify-center border-dashed">
                <div className="text-center p-8 opacity-50">
                  <Scan size={40} className="mx-auto mb-3" />
                  <p className="text-sm">Les données apparaîtront ici</p>
                </div>
              </Card>
            )}

            {loading && (
              <Card className="h-full flex flex-col items-center justify-center p-8 gap-4">
                <Spinner size={32} />
                <OcrSteps />
              </Card>
            )}

            {ocrResult && editedResult && !saved && (
              <Card className="h-full flex flex-col">
                <CardHeader className="p-5 pb-0 flex-row justify-between items-center">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckCircle size={15} className="text-primary" /> Données
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px]">{ocrResult.confidence}% confiance</Badge>
                </CardHeader>
                <CardContent className="p-5 flex-1 space-y-4">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="w-1 h-3 bg-primary rounded-full" />
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Type</label>
                    </div>
                    <Select value={editedResult.documentType} onValueChange={v => setEditedResult({...editedResult, documentType: v as any})}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DOC_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="w-1 h-3 bg-primary rounded-full" />
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Expiration</label>
                      </div>
                      <input type="date" value={editedResult.expiryDate || ''} onChange={e => setEditedResult({...editedResult, expiryDate: e.target.value})} className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="w-1 h-3 bg-primary rounded-full" />
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Plaque</label>
                      </div>
                      <input type="text" value={editedResult.plate || ''} onChange={e => setEditedResult({...editedResult, plate: e.target.value})} className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm font-mono uppercase" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="w-1 h-3 bg-primary rounded-full" />
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Marque</label>
                      </div>
                      <div className="relative">
                        <input type="text" value={editedResult.marque || ''} onChange={e => setEditedResult({...editedResult, marque: e.target.value})} placeholder="ex: PEUGEOT" className="flex h-9 w-full rounded-md border border-input bg-background pl-8 pr-3 text-sm uppercase" />
                        <div className="absolute left-2.5 top-2.5 opacity-80 flex items-center justify-center w-4 h-4">
                          {(() => {
                            const foundLogo = SUPPORTED_LOGOS.find(logo => editedResult.marque?.toLowerCase().includes(logo));
                            return foundLogo ? (
                              <img src={`/${foundLogo}.png`} className="w-full h-full object-contain" alt="" />
                            ) : (
                              <svg className="opacity-50" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a2 2 0 0 0-1.6-.8H9.3a2 2 0 0 0-1.6.8L5 11l-5.16.86a1 1 0 0 0-.84.99V16h3m10 0a2 2 0 1 1-4 0m4 0a2 2 0 1 0-4 0m-10 0a2 2 0 1 1-4 0m4 0a2 2 0 1 0-4 0"/></svg>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="w-1 h-3 bg-primary rounded-full" />
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">N° Châssis</label>
                      </div>
                      <input type="text" value={editedResult.chassis || ''} onChange={e => setEditedResult({...editedResult, chassis: e.target.value})} placeholder="VIN" className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm font-mono uppercase text-[11px]" />
                    </div>
                  </div>
                </CardContent>
                <Separator />
                <CardFooter className="p-3 gap-2">
                  <Button className="flex-1 h-9 text-xs" onClick={handleConfirm} disabled={!matchedVehicle}>Confirmer</Button>
                  <Button variant="outline" className="h-9 text-xs" onClick={reset}>Annuler</Button>
                </CardFooter>
              </Card>
            )}

            {saved && (
              <Card className="h-full bg-emerald-500/5 border-emerald-500/20 flex flex-col items-center justify-center p-8 gap-4 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Check size={24} />
                </div>
                <div>
                  <p className="font-bold">Document Enregistré</p>
                  <p className="text-xs text-muted-foreground mt-1">Le véhicule a été mis à jour avec succès.</p>
                </div>
                <div className="flex gap-2 w-full mt-2">
                  <Button className="flex-1 h-8 text-xs" onClick={() => setPage('vehicles')}>Voir Flotte</Button>
                  <Button variant="outline" className="flex-1 h-8 text-xs" onClick={reset}>Nouveau</Button>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Right Section: Showcase */}
        <div className="flex flex-col gap-4 relative">
          <Card className="overflow-hidden border-none shadow-none bg-transparent">
            <CardHeader className="p-0 pb-3 flex-row items-center justify-between">
              <CardTitle className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-black flex items-center gap-2">
                <Sparkles size={12} className="text-primary" /> Document Démo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                {[
                  { id: 'assur', src: '/mock-assurance.png', label: 'Assurance' },
                  { id: 'carte', src: '/mock-carte-grise.png', label: 'Carte Grise' },
                  { id: 'ct', src: '/mock-controle.png', label: 'Contrôle Tech.' }
                ].map((doc) => (
                  <motion.div 
                    key={doc.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98, cursor: 'grabbing' }}
                    className="relative group cursor-grab overflow-hidden rounded-xl border border-primary/10 shadow-sm aspect-[4/3] bg-white transition-all hover:shadow-md"
                    draggable
                    onDragStart={(e: any) => {
                      e.dataTransfer.setData('text/plain', window.location.origin + doc.src);
                      e.dataTransfer.effectAllowed = 'copyMove';
                    }}
                  >
                    <img src={doc.src} alt={doc.label} className="w-full h-full object-cover object-top" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white backdrop-blur-[1px]">
                      <Scan size={24} className="mb-2" />
                      <p className="font-bold text-[11px] uppercase tracking-wider text-center px-4">Glisser vers l'OCR</p>
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                      <Badge className="bg-white text-slate-800 border-none text-[9px] shadow-sm font-bold">{doc.label}</Badge>
                      <div className="bg-primary text-white p-1 rounded-full shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 9c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9Z"/><path d="M9 22V8"/><path d="M15 22V8"/></svg>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-1 pb-4 text-center">
                <p className="text-[10px] text-muted-foreground leading-relaxed font-medium px-4">
                  Glissez un de ces documents sur la zone d'upload pour lancer l'IA.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
