import { useState } from "react"
import { Truck, Car, Package, Eye, SlidersHorizontal, Search } from "lucide-react"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/StatusBadge"
import { cn, getDocStatus, calcComplianceScore } from "@/lib/utils"
import type { Vehicle, Page, DocStatus } from "@/types"

const ALL_COLUMNS = ["#", "Logo", "Véhicule", "Type", "Année", "Documents", "Conformité", "Statut"] as const
type Column = typeof ALL_COLUMNS[number]

const TYPE_ICON: Record<string, typeof Truck> = {
  Truck: Truck, Van: Car, "Heavy Van": Package,
}

const STATUS_LABEL: Record<string, string> = {
  "": "Tous statuts",
  valid: "Valide",
  expiring: "Expire bientôt",
  expired: "Expiré",
}

function VehicleLogo({ vehicle }: { vehicle: Vehicle }) {
  const Icon = TYPE_ICON[vehicle.type] ?? Truck
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="h-9 w-9 rounded-full flex items-center justify-center ring-2 ring-background shadow-sm cursor-default shrink-0 transition-all hover:scale-110 overflow-hidden bg-white"
            style={{ color: vehicle.color }}
          >
            {vehicle.logo ? (
              <img src={vehicle.logo} alt={vehicle.name} className="h-full w-full object-contain p-1.5" />
            ) : (
              <div 
                className="w-full h-full flex items-center justify-center"
                style={{ background: `${vehicle.color}15` }}
              >
                <Icon size={16} strokeWidth={2} />
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent showArrow side="right" className="text-xs">
          <p className="font-bold">{vehicle.name}</p>
          <p className="text-[10px] text-muted-foreground">{vehicle.type} · {vehicle.year}</p>
          <p className="text-[10px] text-muted-foreground font-mono uppercase">{vehicle.plate}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function DocStack({ vehicle }: { vehicle: Vehicle }) {
  return (
    <TooltipProvider>
      <div className="flex -space-x-1.5">
        {vehicle.documents.map(doc => {
          const st = getDocStatus(doc.expiryDate)
          const color = {
            valid:    "hsl(var(--status-valid))",
            expiring: "hsl(var(--status-expiring))",
            expired:  "hsl(var(--status-expired))",
          }[st]
          const iconSrc = doc.type === "Contrôle Technique" ? "/icon-ct.png"
            : doc.type === "Carte Grise" ? "/icon-cg.png"
            : doc.type === "Assurance" ? "/icon-assurance.png"
            : null
          
          const initial = doc.type === "Contrôle Technique" ? "CT"
            : doc.type === "Carte Grise" ? "CG"
            : doc.type.charAt(0)

          return (
            <Tooltip key={doc.id}>
              <TooltipTrigger asChild>
                <div
                  className="h-7 w-7 rounded-full ring-2 ring-background flex items-center justify-center cursor-default text-[9px] font-bold transition-transform hover:scale-110 hover:z-10 relative overflow-hidden bg-white shadow-sm"
                  style={!iconSrc ? { background: `${color}18`, color } : {}}
                >
                  {iconSrc ? (
                    <img src={iconSrc} alt={doc.type} className="h-full w-full object-contain" />
                  ) : (
                    initial
                  )}
                  {/* Small status indicator on the icon */}
                  <div 
                    className="absolute bottom-0 right-0 w-2 h-2 rounded-full border border-background"
                    style={{ background: color }}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent showArrow side="top" className="text-xs">
                <p className="font-semibold">{doc.type}</p>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(doc.expiryDate).toLocaleDateString("fr-DZ", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
                <p className="text-[10px] font-medium capitalize" style={{ color }}>
                  {st === "valid" ? "Valide" : st === "expiring" ? "Expire bientôt" : "Expiré"}
                </p>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </TooltipProvider>
  )
}

function worstStatus(v: Vehicle): DocStatus {
  const s = v.documents.map(d => getDocStatus(d.expiryDate))
  if (s.includes("expired")) return "expired"
  if (s.includes("expiring")) return "expiring"
  return "valid"
}

interface FleetTableProps {
  vehicles: Vehicle[]
  onViewVehicle: (id: string) => void
  setPage: (p: Page, vehicleId?: string) => void
}

export function FleetTable({ vehicles, onViewVehicle, setPage }: FleetTableProps) {
  const [visibleColumns, setVisibleColumns] = useState<Column[]>([...ALL_COLUMNS])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  const filtered = vehicles.filter(v => {
    const q = search.toLowerCase()
    const searchMatch = !search ||
      v.name.toLowerCase().includes(q) ||
      v.plate.toLowerCase().includes(q) ||
      v.type.toLowerCase().includes(q)
    const statusMatch = !statusFilter || worstStatus(v) === statusFilter
    return searchMatch && statusMatch
  })

  const toggleColumn = (col: Column) => {
    setVisibleColumns(prev =>
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    )
  }

  const show = (col: Column) => visibleColumns.includes(col)

  return (
    <div>
      {/* ── Controls bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-y border-border bg-muted/20">
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Rechercher…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-8 pl-7 w-44 text-xs"
            />
          </div>

          {/* Status filter pills */}
          <div className="flex items-center gap-1">
            {["", "valid", "expiring", "expired"].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "h-8 px-2.5 rounded-md text-[11px] font-medium border transition-all cursor-pointer",
                  statusFilter === s
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border text-muted-foreground hover:bg-muted",
                )}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {filtered.length} / {vehicles.length} résultat{filtered.length > 1 ? "s" : ""}
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                <SlidersHorizontal size={12} /> Colonnes
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel className="text-xs">Colonnes visibles</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ALL_COLUMNS.map(col => (
                <DropdownMenuCheckboxItem
                  key={col}
                  checked={visibleColumns.includes(col)}
                  onCheckedChange={() => toggleColumn(col)}
                  className="text-xs"
                >
                  {col}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border">
              {show("#")          && <TableHead className="w-10 text-center">#</TableHead>}
              {show("Logo")       && <TableHead className="w-12">Logo</TableHead>}
              {show("Véhicule")   && <TableHead className="min-w-[160px]">Véhicule</TableHead>}
              {show("Type")       && <TableHead className="w-24">Type</TableHead>}
              {show("Année")      && <TableHead className="w-16">Année</TableHead>}
              {show("Documents")  && <TableHead className="w-36">Documents</TableHead>}
              {show("Conformité") && <TableHead className="w-36">Conformité</TableHead>}
              {show("Statut")     && <TableHead className="w-32">Statut</TableHead>}
              <TableHead className="w-16 text-right pr-4">Voir</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtered.length > 0 ? (
              filtered.map((v, idx) => {
                const score = calcComplianceScore(v.documents)
                const scoreColor =
                  score >= 80 ? "hsl(var(--status-valid))" :
                  score >= 50 ? "hsl(var(--status-expiring))" :
                                "hsl(var(--status-expired))"
                const ws = worstStatus(v)

                return (
                  <TableRow
                    key={v.id}
                    className="cursor-pointer group"
                    onClick={() => setPage("vehicle-detail", v.id)}
                  >
                    {show("#") && (
                      <TableCell className="text-center">
                        <span className="text-[11px] text-muted-foreground tabular-nums">{idx + 1}</span>
                      </TableCell>
                    )}
                    {show("Logo") && (
                      <TableCell onClick={e => e.stopPropagation()}>
                        <VehicleLogo vehicle={v} />
                      </TableCell>
                    )}
                    {show("Véhicule") && (
                      <TableCell>
                        <p className="text-[13px] font-semibold whitespace-nowrap group-hover:text-primary transition-colors">
                          {v.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-mono">{v.plate}</p>
                      </TableCell>
                    )}
                    {show("Type") && (
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px] font-medium">{v.type}</Badge>
                      </TableCell>
                    )}
                    {show("Année") && (
                      <TableCell className="text-sm tabular-nums font-medium">{v.year}</TableCell>
                    )}
                    {show("Documents") && (
                      <TableCell onClick={e => e.stopPropagation()}>
                        <DocStack vehicle={v} />
                      </TableCell>
                    )}
                    {show("Conformité") && (
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Progress
                            value={score}
                            className="h-1.5 w-20 flex-shrink-0"
                            style={{ "--progress-color": scoreColor } as React.CSSProperties}
                          />
                          <span className="text-xs font-bold tabular-nums shrink-0" style={{ color: scoreColor }}>
                            {score}%
                          </span>
                        </div>
                      </TableCell>
                    )}
                    {show("Statut") && (
                      <TableCell onClick={e => e.stopPropagation()}>
                        <StatusBadge status={ws} />
                      </TableCell>
                    )}
                    <TableCell className="text-right pr-4" onClick={e => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => onViewVehicle(v.id)}
                      >
                        <Eye size={13} />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length + 1}
                  className="text-center py-12"
                >
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Search size={20} className="opacity-40" />
                    <p className="text-sm">Aucun véhicule trouvé</p>
                    <p className="text-xs opacity-70">Essayez de modifier les filtres</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Footer ── */}
      {filtered.length > 0 && (
        <div className="px-4 py-2 border-t border-border bg-muted/10 flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">
            Affichage de {filtered.length} véhicule{filtered.length > 1 ? "s" : ""}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {vehicles.flatMap(v => v.documents).length} documents au total
          </p>
        </div>
      )}
    </div>
  )
}
