import { useState } from 'react'
import { Search, Truck } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { StatusBadge } from '@/components/StatusBadge'
import { PageHeader } from '@/components/layout/PageHeader'
import { getDocStatus, calcComplianceScore } from '@/lib/utils'
import type { Vehicle, Page, DocStatus } from '@/types'

interface VehiclesProps {
  vehicles: Vehicle[]
  setPage: (p: Page, vehicleId?: string) => void
}

export function Vehicles({ vehicles, setPage }: VehiclesProps) {
  const [search, setSearch] = useState('')

  const filtered = vehicles.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.plate.toLowerCase().includes(search.toLowerCase())
  )

  function worstStatus(v: Vehicle): DocStatus {
    const s = v.documents.map(d => getDocStatus(d.expiryDate))
    if (s.includes('expired')) return 'expired'
    if (s.includes('expiring')) return 'expiring'
    return 'valid'
  }

  return (
    <div className="pb-12">
      <PageHeader title="Véhicules" subtitle={`${vehicles.length} véhicules dans la flotte`}>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher…"
            className="pl-8 w-48 h-9"
          />
        </div>
      </PageHeader>

      <div className="mt-5 mx-7 grid grid-cols-[repeat(auto-fill,minmax(288px,1fr))] gap-3.5">
        {filtered.map(v => {
          const score = calcComplianceScore(v.documents)
          const ws = worstStatus(v)
          const scoreColor =
            score >= 80 ? 'hsl(var(--status-valid))' :
            score >= 50 ? 'hsl(var(--status-expiring))' :
                          'hsl(var(--status-expired))'

          return (
            <Card
              key={v.id}
              className="cursor-pointer overflow-hidden transition-all hover:shadow-md hover:-translate-y-px"
              onClick={() => setPage('vehicle-detail', v.id)}
            >
              {/* Accent bar */}
              <div className="h-[3px]" style={{ background: v.color }} />

              <CardContent className="p-4">
                {/* Header */}
                <div className="flex justify-between items-start mb-3.5 gap-2.5">
                  <div className="flex gap-2.5 items-center min-w-0">
                    <div
                      className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center border border-slate-100 bg-white overflow-hidden shadow-sm"
                    >
                      {v.logo ? (
                        <img src={v.logo} alt={v.name} className="h-full w-full object-contain p-1.5" />
                      ) : (
                        <Truck size={18} style={{ color: v.color }} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{v.name}</div>
                      <div className="text-[11px] text-muted-foreground mt-px truncate">
                        {v.plate} · {v.year}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={ws} />
                </div>

                <Separator className="mb-3" />

                {/* Documents */}
                <div className="flex flex-col gap-1.5">
                  {v.documents.map(d => {
                    const st = getDocStatus(d.expiryDate)
                    const dotColor = {
                      valid: 'hsl(var(--status-valid))',
                      expiring: 'hsl(var(--status-expiring))',
                      expired: 'hsl(var(--status-expired))',
                    }[st]
                    return (
                      <div
                        key={d.id}
                        className="flex justify-between items-center px-2.5 py-1.5 rounded-md bg-muted/50 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-sm overflow-hidden flex-shrink-0 bg-white">
                            {d.type === "Contrôle Technique" ? (
                              <img src="/icon-ct.png" alt="" className="w-full h-full object-contain" />
                            ) : d.type === "Carte Grise" ? (
                              <img src="/icon-cg.png" alt="" className="w-full h-full object-contain" />
                            ) : d.type === "Assurance" ? (
                              <img src="/icon-assurance.png" alt="" className="w-full h-full object-contain" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[8px] font-bold" style={{ color: dotColor }}>
                                {d.type.charAt(0)}
                              </div>
                            )}
                          </div>
                          <span className="font-medium">{d.type}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground">
                            {new Date(d.expiryDate).toLocaleDateString('fr-DZ', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: dotColor }} />
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Compliance bar */}
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">Conformité</span>
                    <span className="font-bold" style={{ color: scoreColor }}>{score}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${score}%`, background: scoreColor }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
