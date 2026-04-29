import {
  Truck, AlertTriangle, ShieldCheck, Clock,
  TrendingUp, TrendingDown, Minus, ArrowRight,
  CheckCircle2, XCircle, Car, Package, LayoutGrid,
  BellRing, Activity, FileText, FileSpreadsheet
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip"
import { CircularProgress } from "@/components/CircularProgress"
import { StatusBadge } from "@/components/StatusBadge"
import { FleetTable } from "@/components/ui/fleet-table"
import { ButtonColorful } from "@/components/ui/button-colorful"
import { getDocStatus, calcComplianceScore, fmtDate, cn } from "@/lib/utils"
import type { Vehicle, Page, DocStatus } from "@/types"
import { motion, AnimatePresence } from "framer-motion"

interface DashboardProps {
  vehicles: Vehicle[]
  setPage: (p: Page, vehicleId?: string) => void
}

const VEHICLE_ICON: Record<string, typeof Truck> = {
  Truck: Truck, Van: Car, "Heavy Van": Package,
}

// ── Animations ─────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 30 } }
} as const

// ── KPI card ──────────────────────────────────────────────
interface KpiProps {
  label: string
  value: string | number
  sub: string
  icon: React.ReactNode
  accentColor: string
  trend?: "up" | "down" | "flat"
  progress?: number
  onClick?: () => void
}

function KpiCard({ label, value, sub, icon, accentColor, trend, progress, onClick }: KpiProps) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus
  const trendColor = trend === "up" ? "text-emerald-600 bg-emerald-50/50" : trend === "down" ? "text-red-600 bg-red-50/50" : "text-slate-600 bg-slate-50/50"

  return (
    <motion.div 
      variants={itemVariants} 
      className="h-full group"
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Card
        className="relative h-full overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 hover:border-emerald-100 bg-white border-slate-100"
        onClick={onClick}
      >
        <CardContent className="p-6 relative z-10">
          <div className="flex items-start justify-between mb-5">
            <div className="space-y-1">
              <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-wider">{label}</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tabular-nums tracking-tight">{value}</span>
              </div>
            </div>
            
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-500 shadow-inner"
              style={{ 
                background: `linear-gradient(135deg, ${accentColor}15 0%, ${accentColor}05 100%)`, 
                color: accentColor,
                border: `1px solid ${accentColor}20`
              }}
            >
              {icon}
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-auto">
            <p className="text-sm text-slate-500 font-medium">{sub}</p>
            {progress !== undefined && (
              <span className={cn("inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border border-current/10", trendColor)}>
                <TrendIcon size={12} />
                {Math.round(progress)}%
              </span>
            )}
          </div>
        </CardContent>
        
        {/* Subtle decorative glow */}
        <div 
          className="absolute -bottom-6 -right-6 w-24 h-24 blur-3xl rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-500"
          style={{ backgroundColor: accentColor }}
        />

        {progress !== undefined && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-50">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full transition-all duration-1000 ease-out" 
              style={{ 
                background: `linear-gradient(to right, ${accentColor}, color-mix(in srgb, ${accentColor}, white 30%))` 
              }} 
            />
          </div>
        )}
      </Card>
    </motion.div>
  )
}

// ── Urgent alert row ───────────────────────────────────────
function AlertRow({
  doc, vehicle, onClick,
}: {
  doc: Vehicle["documents"][0] & { vehicleId: string }
  vehicle: Vehicle
  onClick: () => void
}) {
  const st = getDocStatus(doc.expiryDate)
  const isExpired = st === "expired"
  const borderColor = isExpired ? "hsl(var(--status-expired))" : "hsl(var(--status-expiring))"
  const VIcon = VEHICLE_ICON[vehicle.type] ?? Truck

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
      className="flex items-center gap-4 px-6 py-4 cursor-pointer transition-colors group relative"
      onClick={onClick}
    >
      <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: borderColor }} />
      
      <div
        className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center border overflow-hidden bg-white"
        style={{ color: vehicle.color, borderColor: `${vehicle.color}30` }}
      >
        {vehicle.logo ? (
          <img src={vehicle.logo} alt={vehicle.name} className="h-full w-full object-contain p-1.5" />
        ) : (
          <VIcon size={18} strokeWidth={2} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate leading-tight group-hover:text-primary transition-colors">{vehicle.name}</p>
        <p className="text-xs text-slate-500 truncate mt-1 flex items-center gap-1.5">
          <FileText size={12} className="opacity-70" /> {doc.type} <span className="opacity-40">•</span> {vehicle.plate}
        </p>
      </div>

      <div className="text-right shrink-0 flex flex-col items-end justify-center">
        <StatusBadge status={st} />
        <p className="text-xs font-medium text-slate-500 mt-1.5 flex items-center gap-1">
          <Clock size={12} /> {fmtDate(doc.expiryDate)}
        </p>
      </div>
    </motion.div>
  )
}

// ── Main Dashboard ─────────────────────────────────────────
export function Dashboard({ vehicles, setPage }: DashboardProps) {
  const allDocs = vehicles.flatMap(v =>
    v.documents.map(d => ({ ...d, vehicleId: v.id }))
  )
  const validCount    = allDocs.filter(d => getDocStatus(d.expiryDate) === "valid").length
  const expiringCount = allDocs.filter(d => getDocStatus(d.expiryDate) === "expiring").length
  const expiredCount  = allDocs.filter(d => getDocStatus(d.expiryDate) === "expired").length
  const compliance    = calcComplianceScore(allDocs)

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir"

  const complianceColor =
    compliance >= 80 ? "hsl(var(--status-valid))" :
    compliance >= 50 ? "hsl(var(--status-expiring))" :
                       "hsl(var(--status-expired))"

  const urgentDocs = allDocs
    .filter(d => ["expiring", "expired"].includes(getDocStatus(d.expiryDate)))
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())

  return (
    <motion.div 
      initial="hidden" 
      animate="show" 
      variants={containerVariants} 
      className="pb-12 max-w-[1400px] mx-auto px-6 pt-6"
    >
      {/* ══════════════════════════════════════════════════════
          CLEAN SAAS HEADER
      ══════════════════════════════════════════════════════ */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 relative">
        {/* Decorative background glows (subtle) */}
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="relative group">
            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-xl shadow-emerald-100/50 overflow-hidden ring-4 ring-white transition-transform group-hover:scale-105 duration-300">
              <img src="/profile.png" alt="Hadji Khaoula" className="w-full h-full object-cover" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-4 border-white shadow-sm" />
          </div>

          <div>
            <div className="flex items-center gap-3 mb-1.5 flex-wrap">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
                {greeting}, <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500">Hadji Khaoula</span> <span className="inline-block animate-wave">👋</span>
              </h1>
            </div>
            <p className="text-base text-slate-500 font-medium flex items-center gap-3">
              <Clock size={16} className="text-slate-400" />
              <span className="tabular-nums">
                {new Date().toLocaleDateString("fr-DZ", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
              <span className="text-slate-400 font-semibold tracking-wide uppercase text-[11px]">Overview</span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 relative z-10">
          <Button 
            variant="outline" 
            className="gap-2.5 bg-white h-12 px-6 shadow-sm border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold text-[13px] transition-all hover:scale-[1.02] active:scale-[0.98]" 
            onClick={() => setPage("reports")}
          >
            <FileSpreadsheet size={18} className="text-slate-400" /> Rapports
          </Button>
          <ButtonColorful 
            label="Nouveau document" 
            onClick={() => setPage("upload")} 
            className="h-12 px-7 shadow-lg shadow-emerald-100 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]" 
          />
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════
          KPI CARDS
      ══════════════════════════════════════════════════════ */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <KpiCard
          label="Total Véhicules"
          value={vehicles.length}
          sub={`${allDocs.length} documents au total`}
          icon={<Truck size={20} />}
          accentColor="hsl(var(--primary))"
          trend="flat"
          progress={100}
          onClick={() => setPage("vehicles")}
        />
        <KpiCard
          label="Expirent Bientôt"
          value={expiringCount}
          sub="Dans les 7 prochains jours"
          icon={<BellRing size={20} />}
          accentColor="hsl(var(--status-expiring))"
          trend={expiringCount > 0 ? "down" : "flat"}
          progress={allDocs.length ? (expiringCount / allDocs.length) * 100 : 0}
          onClick={() => setPage("reports")}
        />
        <KpiCard
          label="Documents Expirés"
          value={expiredCount}
          sub="Action immédiate requise"
          icon={<XCircle size={20} />}
          accentColor="hsl(var(--status-expired))"
          trend={expiredCount > 0 ? "down" : "flat"}
          progress={allDocs.length ? (expiredCount / allDocs.length) * 100 : 0}
          onClick={() => setPage("reports")}
        />
        <KpiCard
          label="Conformité Globale"
          value={`${compliance}%`}
          sub={`${validCount} / ${allDocs.length} documents valides`}
          icon={<ShieldCheck size={20} />}
          accentColor={complianceColor}
          trend={compliance >= 80 ? "up" : compliance >= 50 ? "flat" : "down"}
          progress={compliance}
          onClick={() => setPage("reports")}
        />
      </motion.div>

      {/* ══════════════════════════════════════════════════════
          MIDDLE ROW
      ══════════════════════════════════════════════════════ */}
      <div className="mt-8 grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-6">

        {/* ── Compliance overview card ── */}
        <motion.div variants={itemVariants} className="h-full">
          <Card className="h-full overflow-hidden border-slate-200 shadow-sm bg-white">
            <CardHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity size={18} className="text-slate-400" />
                  <CardTitle className="text-base font-semibold text-slate-900">Conformité de la flotte</CardTitle>
                </div>
                <Badge
                  variant={compliance >= 80 ? "success" : compliance >= 50 ? "warning" : "error"}
                  className="text-xs px-2.5 py-0.5 rounded-full"
                >
                  {compliance >= 80 ? "Excellente" : compliance >= 50 ? "Moyenne" : "Critique"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-6 pt-6 pb-6">
              {/* Donut + legend */}
              <div className="flex items-center gap-8 mb-8">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                >
                  <CircularProgress value={compliance} size={110} color={complianceColor} thickness={10} />
                </motion.div>
                <div className="flex flex-col gap-4 flex-1 min-w-0">
                  {[
                    { label: "Valides",          count: validCount,    color: "hsl(var(--status-valid))",    pct: allDocs.length ? (validCount / allDocs.length) * 100 : 0 },
                    { label: "Expirent bientôt", count: expiringCount, color: "hsl(var(--status-expiring))", pct: allDocs.length ? (expiringCount / allDocs.length) * 100 : 0 },
                    { label: "Expirés",          count: expiredCount,  color: "hsl(var(--status-expired))",  pct: allDocs.length ? (expiredCount / allDocs.length) * 100 : 0 },
                  ].map((item, i) => (
                    <motion.div 
                      key={item.label}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                          <span className="text-xs font-medium text-slate-500">{item.label}</span>
                        </div>
                        <span className="text-sm font-bold tabular-nums text-slate-900">
                          {item.count}
                        </span>
                      </div>
                      <Progress
                        value={item.pct}
                        className="h-1.5 rounded-full bg-slate-100"
                        style={{ "--progress-color": item.color } as React.CSSProperties}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>

              <Separator className="mb-5 bg-slate-100" />

              {/* Per-vehicle compliance */}
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                Détail par véhicule
              </p>
              <div className="space-y-1.5 pr-2 overflow-y-auto max-h-[220px]">
                {vehicles.map((v, i) => {
                  const score = calcComplianceScore(v.documents)
                  const scoreColor =
                    score >= 80 ? "hsl(var(--status-valid))" :
                    score >= 50 ? "hsl(var(--status-expiring))" :
                                  "hsl(var(--status-expired))"
                  const VIcon = VEHICLE_ICON[v.type] ?? Truck
                  return (
                    <motion.div
                      key={v.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + i * 0.05 }}
                      className="flex items-center gap-3 cursor-pointer group p-2 -mx-2 rounded-lg hover:bg-slate-50 transition-colors"
                      onClick={() => setPage("vehicle-detail", v.id)}
                    >
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center border border-slate-100 bg-white overflow-hidden"
                              style={{ color: v.color }}
                            >
                              {v.logo ? (
                                <img src={v.logo} alt={v.name} className="h-full w-full object-contain p-1" />
                              ) : (
                                <VIcon size={14} strokeWidth={2} />
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="text-xs">{v.name}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-end mb-1.5">
                          <span className="text-sm font-medium text-slate-700 truncate group-hover:text-primary transition-colors">
                            {v.name}
                          </span>
                          <span className="font-semibold text-xs tabular-nums ml-2 shrink-0" style={{ color: scoreColor }}>
                            {score}%
                          </span>
                        </div>
                        <Progress
                          value={score}
                          className="h-1 rounded-full bg-slate-100"
                          style={{ "--progress-color": scoreColor } as React.CSSProperties}
                        />
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Document alerts card ── */}
        <motion.div variants={itemVariants} className="h-full">
          <Card className="h-full overflow-hidden flex flex-col border-slate-200 shadow-sm bg-white">
            <CardHeader className="px-6 pt-6 pb-4 shrink-0 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={18} className="text-orange-500" />
                  <div>
                    <CardTitle className="text-base font-semibold text-slate-900">Documents prioritaires</CardTitle>
                    <p className="text-xs text-slate-500 mt-1">
                      {urgentDocs.length > 0
                        ? `${urgentDocs.length} document${urgentDocs.length > 1 ? "s" : ""} nécessite${urgentDocs.length > 1 ? "nt" : ""} attention`
                        : "Tous les documents sont à jour"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {urgentDocs.length > 0 && (
                    <Badge variant="error" className="text-xs px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 hover:bg-red-50 border-0">
                      {urgentDocs.length} urgent{urgentDocs.length > 1 ? "s" : ""}
                    </Badge>
                  )}
                  <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 text-slate-500 hover:text-slate-900" onClick={() => setPage("reports")}>
                    Voir tout <ArrowRight size={14} />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <div className="flex-1 min-h-0 bg-slate-50/50 relative">
              {urgentDocs.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center h-full py-16 gap-4 text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                    <CheckCircle2 size={32} />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-slate-900">Flotte parfaitement conforme</p>
                    <p className="text-sm text-slate-500 mt-1">Aucun document expiré ou en retard</p>
                  </div>
                </motion.div>
              ) : (
                <div className="divide-y divide-slate-100 overflow-y-auto h-full max-h-[400px]">
                  <AnimatePresence>
                    {urgentDocs.map(doc => {
                      const vehicle = vehicles.find(v => v.id === doc.vehicleId)!
                      return (
                        <AlertRow
                          key={doc.id}
                          doc={doc}
                          vehicle={vehicle}
                          onClick={() => setPage("vehicle-detail", doc.vehicleId)}
                        />
                      )
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {urgentDocs.length > 0 && (
              <div className="px-6 py-3 shrink-0 bg-white border-t border-slate-100">
                <p className="text-xs text-slate-400 text-center flex items-center justify-center gap-1.5">
                  <Activity size={12} className="opacity-50" /> Cliquer sur une ligne pour voir le détail
                </p>
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* ══════════════════════════════════════════════════════
          FLEET TABLE
      ══════════════════════════════════════════════════════ */}
      <motion.div variants={itemVariants} className="mt-8">
        <Card className="overflow-hidden border-slate-200 shadow-sm bg-white">
          <CardHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LayoutGrid size={18} className="text-slate-400" />
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900">Flotte de véhicules</CardTitle>
                  <p className="text-xs text-slate-500 mt-1">
                    {vehicles.length} véhicules gérés
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-2 bg-white border-slate-200" onClick={() => setPage("vehicles")}>
                <LayoutGrid size={14} className="text-slate-500" /> Vue grille complète
              </Button>
            </div>
          </CardHeader>

          <div>
            <FleetTable
              vehicles={vehicles}
              onViewVehicle={id => setPage("vehicle-detail", id)}
              setPage={setPage}
            />
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}
