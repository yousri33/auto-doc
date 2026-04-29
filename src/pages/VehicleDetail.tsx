import { ChevronLeft, Upload, Shield, FileText, CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { StatusBadge } from '@/components/StatusBadge'
import { PageHeader } from '@/components/layout/PageHeader'
import { getDocStatus, calcComplianceScore, fmtDate, daysLeft } from '@/lib/utils'
import type { Vehicle, Page } from '@/types'

interface VehicleDetailProps {
  vehicles: Vehicle[]
  vehicleId: string | null
  setPage: (p: Page, vehicleId?: string) => void
}

const DOC_ICONS: Record<string, typeof Shield> = {
  Assurance: Shield,
  'Carte Grise': FileText,
  'Contrôle Technique': CheckCircle,
}

export function VehicleDetail({ vehicles, vehicleId, setPage }: VehicleDetailProps) {
  const vehicle = vehicles.find(v => v.id === vehicleId)
  if (!vehicle) {
    return <div className="p-10 text-muted-foreground">Véhicule introuvable.</div>
  }

  const compliance = calcComplianceScore(vehicle.documents)
  const complianceColor =
    compliance >= 80 ? 'hsl(var(--status-valid))' :
    compliance >= 50 ? 'hsl(var(--status-expiring))' :
                       'hsl(var(--status-expired))'

  return (
    <div className="pb-12">
      {/* Breadcrumb */}
      <div className="px-7 pt-5">
        <button
          onClick={() => setPage('vehicles')}
          className="inline-flex items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground transition-colors cursor-pointer bg-transparent border-none p-0"
        >
          <ChevronLeft size={14} /> Retour aux véhicules
        </button>
      </div>

      <PageHeader
        title={vehicle.name}
        subtitle={`${vehicle.plate} · ${vehicle.type} · ${vehicle.year}`}
      >
        <Button size="sm" onClick={() => setPage('upload')}>
          <Upload size={14} /> Ajouter un document
        </Button>
      </PageHeader>

      {/* Summary card */}
      <div className="mx-7 mt-5">
        <Card className="overflow-hidden">
          <div className="h-1" style={{ background: vehicle.color }} />
          <CardContent className="p-5">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div className="flex gap-3.5 items-center">
                <div
                  className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center border border-slate-100 bg-white overflow-hidden shadow-sm"
                >
                  {vehicle.logo ? (
                    <img src={vehicle.logo} alt="" className="h-full w-full object-contain p-1.5" />
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={vehicle.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 17H4a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v4M7.5 17h7M8 17a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm10 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm-9-6h12M4 9h10"/>
                    </svg>
                  )}
                </div>
                <div>
                  <div className="font-bold text-base">{vehicle.name}</div>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    {vehicle.plate} · {vehicle.type} · {vehicle.year}
                  </div>
                </div>
              </div>
              <div className="flex gap-7">
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: complianceColor }}>{compliance}%</div>
                  <div className="text-[11px] text-muted-foreground uppercase tracking-wider">Conformité</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{vehicle.documents.length}</div>
                  <div className="text-[11px] text-muted-foreground uppercase tracking-wider">Documents</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents */}
      <div className="mx-7 mt-5">
        <h2 className="text-sm font-semibold mb-3">Documents</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
          {vehicle.documents.map(doc => {
            const st = getDocStatus(doc.expiryDate)
            const borderColor = {
              valid:    'hsl(var(--status-valid))',
              expiring: 'hsl(var(--status-expiring))',
              expired:  'hsl(var(--status-expired))',
            }[st]
            const bgColor = {
              valid:    'hsl(var(--status-valid-bg))',
              expiring: 'hsl(var(--status-expiring-bg))',
              expired:  'hsl(var(--status-expired-bg))',
            }[st]

            const DocIcon = DOC_ICONS[doc.type] ?? FileText

            return (
              <Card key={doc.id} className="overflow-hidden" style={{ borderLeft: `3px solid ${borderColor}` }}>
                <CardContent className="p-4">
                  {/* Doc type header */}
                  <div className="flex justify-between items-start mb-3.5">
                    <div className="flex gap-2.5 items-center">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-slate-100 bg-white overflow-hidden shadow-sm"
                      >
                        {doc.type.toLowerCase().includes("contrôle") ? (
                          <img src="/icon-ct.png" alt="" className="w-full h-full object-contain p-1.5" />
                        ) : doc.type.toLowerCase().includes("grise") ? (
                          <img src="/icon-cg.png" alt="" className="w-full h-full object-contain p-1.5" />
                        ) : doc.type.toLowerCase().includes("assurance") ? (
                          <img src="/icon-assurance.png" alt="" className="w-full h-full object-contain p-1.5" />
                        ) : (
                          <DocIcon size={20} style={{ color: borderColor }} />
                        )}
                      </div>
                      <span className="font-semibold text-sm">{doc.type}</span>
                    </div>
                    <StatusBadge status={st} />
                  </div>

                  <Separator className="mb-3" />

                  {/* Metadata */}
                  <div className="flex gap-3.5">
                    <div className="flex-1">
                      <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-1">Expiration</div>
                      <div className="font-semibold text-[13px]">{fmtDate(doc.expiryDate, { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                    </div>
                    <div className="flex-1">
                      <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-1">Ajouté le</div>
                      <div className="font-semibold text-[13px]">{fmtDate(doc.uploadedAt, { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                    </div>
                  </div>

                  {/* Days-left pill */}
                  <div
                    className="mt-3 px-2.5 py-1.5 rounded-md text-xs font-semibold"
                    style={{ background: bgColor, color: borderColor }}
                  >
                    {daysLeft(doc.expiryDate)}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
