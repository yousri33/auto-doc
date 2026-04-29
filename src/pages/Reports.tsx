import { useState, useRef } from 'react'
import { Search, Calendar, FileDown, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table'
import { StatusBadge } from '@/components/StatusBadge'
import { PageHeader } from '@/components/layout/PageHeader'
import { getDocStatus, fmtDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Vehicle, Page, DocStatus } from '@/types'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import html2canvas from 'html2canvas'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

interface ReportsProps {
  vehicles: Vehicle[]
  setPage: (p: Page, vehicleId?: string) => void
}

type FilterKey = 'all' | DocStatus

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',      label: 'Tous' },
  { key: 'valid',    label: 'Valides' },
  { key: 'expiring', label: 'Expirent bientôt' },
  { key: 'expired',  label: 'Expirés' },
]

export function Reports({ vehicles, setPage }: ReportsProps) {
  const [filter, setFilter] = useState<FilterKey>('all')
  const [search, setSearch] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const chartsRef = useRef<HTMLDivElement>(null)

  const allDocs = vehicles.flatMap(v =>
    v.documents.map(d => ({
      ...d,
      vehicleName: v.name,
      vehiclePlate: v.plate,
      vehicleId: v.id,
      vehicleLogo: v.logo,
    }))
  ).sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())

  const counts: Record<FilterKey, number> = {
    all:      allDocs.length,
    valid:    allDocs.filter(d => getDocStatus(d.expiryDate) === 'valid').length,
    expiring: allDocs.filter(d => getDocStatus(d.expiryDate) === 'expiring').length,
    expired:  allDocs.filter(d => getDocStatus(d.expiryDate) === 'expired').length,
  }

  let filtered = allDocs
  if (filter !== 'all') filtered = filtered.filter(d => getDocStatus(d.expiryDate) === filter)
  if (search) {
    const q = search.toLowerCase()
    filtered = filtered.filter(d =>
      d.vehicleName.toLowerCase().includes(q) ||
      d.vehiclePlate.toLowerCase().includes(q) ||
      d.type.toLowerCase().includes(q)
    )
  }

  const pieData = [
    { name: 'Valides', value: counts.valid, color: '#10b981' },
    { name: 'Expirent bientôt', value: counts.expiring, color: '#f59e0b' },
    { name: 'Expirés', value: counts.expired, color: '#ef4444' },
  ].filter(d => d.value > 0)

  // Distribution by type for Bar Chart
  const typeCounts = filtered.reduce((acc, d) => {
    acc[d.type] = (acc[d.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const barData = Object.entries(typeCounts).map(([name, value]) => ({ name, value }))

  const handleGeneratePDF = async () => {
    setIsGenerating(true)
    try {
      const doc = new jsPDF('p', 'mm', 'a4')
      const pageWidth = doc.internal.pageSize.getWidth()
      
      // 1. Preload Logos
      const appLogo = new Image(); appLogo.src = '/logo.png'
      await new Promise(r => appLogo.onload = r)

      const loadedLogos: Record<string, HTMLImageElement> = {}
      for (const d of filtered) {
        const logoPath = d.vehicleLogo
        if (logoPath && !loadedLogos[logoPath]) {
          const img = new Image(); img.src = logoPath
          await new Promise(r => img.onload = () => { loadedLogos[logoPath] = img; r(null) })
        }
      }
      
      // ─── 2. PREMIUM WHITE HEADER ────────────────────────────────────────────
      // Thin emerald accent bar at very top
      doc.setFillColor(16, 185, 129)
      doc.rect(0, 0, pageWidth, 3, 'F')

      // White background for header area
      doc.setFillColor(255, 255, 255)
      doc.rect(0, 3, pageWidth, 42, 'F')

      // Logo on the LEFT — calculating aspect ratio to avoid stretching
      const ratio = appLogo.width / appLogo.height
      const logoW = 32
      const logoH = logoW / ratio
      doc.addImage(appLogo, 'PNG', 14, 12, logoW, logoH)

      // Title on the RIGHT
      doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor(15, 23, 42)
      doc.text('RAPPORT DE FLOTTE', pageWidth - 14, 22, { align: 'right' })

      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(100, 116, 139)
      doc.text(`Généré le ${new Date().toLocaleDateString('fr-DZ')}`, pageWidth - 14, 29, { align: 'right' })
      doc.text(`${filtered.length} documents · ${vehicles.length} véhicules`, pageWidth - 20, 35, { align: 'right' })
      // Tiny logo icon next to stats
      doc.addImage(appLogo, 'PNG', pageWidth - 18, 32, 6, 3)

      // Thin separator line
      doc.setDrawColor(229, 231, 235)
      doc.setLineWidth(0.5)
      doc.line(14, 46, pageWidth - 14, 46)

      // ─── 3. META INFO ───────────────────────────────────────────────────────
      let currentY = 56
      doc.setFont('helvetica', 'italic'); doc.setFontSize(9); doc.setTextColor(148, 163, 184)
      doc.text('Préparé par : Khaoula, Amrane & Leticia  ·  Autodoc DZ — Gestion de Flotte', 14, currentY)
      currentY += 12

      // ─── 4. ANALYTICS SECTION ───────────────────────────────────────────────
      if (chartsRef.current && pieData.length > 0) {
        // Section heading with emerald dot
        doc.setFillColor(16, 185, 129)
        doc.circle(16, currentY - 1.5, 2, 'F')
        doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(15, 23, 42)
        doc.text('Synthèse Analytique', 21, currentY)
        currentY += 5

        const canvas = await html2canvas(chartsRef.current, { scale: 2, backgroundColor: '#ffffff' })
        const chartsImg = canvas.toDataURL('image/png')
        // Light rounded background for charts
        doc.setFillColor(248, 250, 252)
        doc.roundedRect(14, currentY, 182, 78, 4, 4, 'F')
        doc.setDrawColor(229, 231, 235)
        doc.roundedRect(14, currentY, 182, 78, 4, 4, 'S')
        doc.addImage(chartsImg, 'PNG', 16, currentY + 2, 178, 74)
        currentY += 86
      }

      // ─── 5. TABLE SECTION ───────────────────────────────────────────────────
      doc.setFillColor(16, 185, 129)
      doc.circle(16, currentY - 1.5, 2, 'F')
      doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(15, 23, 42)
      doc.text('Détails des Véhicules', 21, currentY)
      currentY += 5

      const tableData = filtered.map(d => [d.vehicleName, d.vehiclePlate, d.type, fmtDate(d.expiryDate), getDocStatus(d.expiryDate).toUpperCase()])

      autoTable(doc, {
        startY: currentY,
        head: [['Véhicule', 'Immatriculation', 'Document', 'Expiration', 'Statut']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8.5, cellPadding: 3 },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 0) data.cell.styles.cellPadding = { left: 14, top: 3, bottom: 3, right: 3 }
          if (data.section === 'body' && data.column.index === 4) {
            const s = data.cell.raw; if (s === 'VALID') data.cell.styles.textColor = [16, 185, 129]
            else if (s === 'EXPIRING') data.cell.styles.textColor = [245, 158, 11]
            else if (s === 'EXPIRED') data.cell.styles.textColor = [239, 68, 68]
          }
        },
        didDrawCell: (data) => {
          if (data.section === 'body' && data.column.index === 0) {
            const logo = filtered[data.row.index].vehicleLogo
            if (logo && loadedLogos[logo]) {
              const dim = 8; doc.addImage(loadedLogos[logo], 'PNG', data.cell.x + 3, data.cell.y + (data.cell.height - dim) / 2, dim, dim)
            }
          }
        }
      })

      doc.save(`rapport_flotte_${new Date().getTime()}.pdf`)
    } catch (e) {
      console.error(e)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="pb-12">
      <PageHeader
        title="Rapports de documents"
        subtitle={`${filtered.length} documents sur ${allDocs.length} total`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="pl-8 w-48 h-9 shadow-sm"
            />
          </div>
          <button
            onClick={handleGeneratePDF}
            disabled={isGenerating || filtered.length === 0}
            className={cn(
              "h-9 px-4 rounded-md flex items-center gap-2 text-sm font-semibold transition-all shadow-sm",
              isGenerating 
                ? "bg-emerald-500/50 text-white cursor-not-allowed" 
                : "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.23)] hover:-translate-y-0.5 active:translate-y-0"
            )}
          >
            {isGenerating ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <FileDown size={16} />
            )}
            Générer PDF
          </button>
        </div>
      </PageHeader>

      {/* Filter tabs */}
      <div className="mx-4 md:mx-7 mt-4 flex gap-2 border-b border-border pb-3 overflow-x-auto no-scrollbar scroll-smooth">
        <div className="flex gap-2 min-w-max">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                'px-3.5 py-2 rounded-md text-[13px] font-medium border-none cursor-pointer transition-all whitespace-nowrap',
                filter === f.key
                  ? 'bg-primary text-white font-semibold'
                  : 'bg-transparent text-muted-foreground hover:bg-muted/50',
              )}
            >
              {f.label}
              <span className="ml-1.5 opacity-70">({counts[f.key]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* PDF-only Analytics Row (Hidden from UI but accessible to html2canvas) */}
      <div style={{ position: 'fixed', left: '-5000px', top: '0', width: '1200px', background: 'white' }}>
        <div ref={chartsRef} className="p-10 bg-white">
          <div className="flex flex-row gap-10">
            <div className="flex-1 h-[400px]">
              <PieChart width={500} height={400}>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  label={{ fill: '#333', fontSize: 18, fontWeight: 'bold' }}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </div>
            <div className="flex-1 h-[400px]">
              <BarChart width={500} height={400} data={barData} margin={{ top: 40, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Bar dataKey="value" fill="#10b981" label={{ position: 'top', fill: '#333', fontSize: 16, fontWeight: 'bold' }} />
              </BarChart>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table UI */}
      <div className="mx-4 md:mx-7 mt-5 overflow-hidden">
        <div className="w-full min-w-0">
          {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Aucun document trouvé
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="max-h-[600px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40 sticky top-0 z-10">
                    <TableHead>Véhicule</TableHead>
                    <TableHead>Document</TableHead>
                    <TableHead>Expiration</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((row, i) => (
                    <TableRow
                      key={i}
                      className="cursor-pointer"
                      onClick={() => setPage('vehicle-detail', row.vehicleId)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full border border-slate-100 bg-white flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                            {row.vehicleLogo ? (
                              <img src={row.vehicleLogo} alt="" className="h-full w-full object-contain p-1" />
                            ) : (
                              <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300">
                                <Calendar size={12} />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-[13px] text-slate-900">{row.vehicleName}</div>
                            <div className="text-[11px] text-muted-foreground font-mono uppercase leading-none mt-0.5">{row.vehiclePlate}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded border border-slate-100 bg-white overflow-hidden flex-shrink-0">
                            {row.type === "Contrôle Technique" ? (
                              <img src="/icon-ct.png" alt="" className="w-full h-full object-contain" />
                            ) : row.type === "Carte Grise" ? (
                              <img src="/icon-cg.png" alt="" className="w-full h-full object-contain" />
                            ) : row.type === "Assurance" ? (
                              <img src="/icon-assurance.png" alt="" className="w-full h-full object-contain" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] font-bold bg-slate-50 text-slate-400">
                                {row.type.charAt(0)}
                              </div>
                            )}
                          </div>
                          <span className="font-medium">{row.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5 text-sm">
                          <Calendar size={13} className="text-muted-foreground" />
                          {fmtDate(row.expiryDate)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={getDocStatus(row.expiryDate)} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
