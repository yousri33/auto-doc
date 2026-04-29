import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Menu } from "lucide-react"
import { Sidebar } from "@/components/layout/Sidebar"
import { NotificationBell } from "@/components/NotificationBell"
import { Dashboard } from "@/pages/Dashboard"
import { Vehicles } from "@/pages/Vehicles"
import { VehicleDetail } from "@/pages/VehicleDetail"
import { Reports } from "@/pages/Reports"
import { Upload } from "@/pages/Upload"
import { MOCK_VEHICLES } from "@/data/mock-data"
import type { Page, Vehicle } from "@/types"

export default function App() {
  const [page, setPageState]                    = useState<Page>("dashboard")
  const [selectedVehicle, setSelectedVehicle]   = useState<string | null>(null)
  const [vehicles, setVehicles]                 = useState<Vehicle[]>(MOCK_VEHICLES)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen]             = useState(false)

  function navigate(p: Page, vehicleId?: string) {
    if (vehicleId) setSelectedVehicle(vehicleId)
    setPageState(p)
    setMobileOpen(false)
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-muted/20">
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar — never scrolls */}
      <Sidebar
        page={page}
        onNavigate={navigate}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileOpen}
      />

      {/* Right panel */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">

        {/* Mobile header */}
        <header className="md:hidden flex items-center gap-3 px-4 py-2.5 border-b border-border bg-card justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="text-foreground p-1 bg-transparent border-none cursor-pointer">
              <Menu size={20} />
            </button>
            <span className="font-semibold text-[15px]">Autodoc DZ</span>
          </div>
          <NotificationBell vehicles={vehicles} />
        </header>

        {/* Desktop topbar — fixed, never scrolls */}
        <div className="hidden md:flex px-6 py-2.5 border-b border-border bg-card justify-between items-center gap-2.5 shrink-0">
          <div className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString("fr-DZ", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </div>
          <NotificationBell vehicles={vehicles} />
        </div>

        {/* Main — scrollable for ALL pages */}
        <div className="flex-1 min-h-0 relative">
          <AnimatePresence mode="wait">
            <motion.main
              key={page + (selectedVehicle ?? "")}
              initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="absolute inset-0 overflow-y-auto no-scrollbar"
            >
              {page === "dashboard"      && <Dashboard vehicles={vehicles} setPage={navigate} />}
              {page === "vehicles"       && <Vehicles vehicles={vehicles} setPage={navigate} />}
              {page === "reports"        && <Reports vehicles={vehicles} setPage={navigate} />}
              {page === "vehicle-detail" && <VehicleDetail vehicles={vehicles} vehicleId={selectedVehicle} setPage={navigate} />}
              {page === "upload"         && <Upload vehicles={vehicles} setVehicles={setVehicles} setPage={navigate} />}
            </motion.main>
          </AnimatePresence>
        </div>

        {/* Footer — fixed, never scrolls */}
        <footer className="hidden md:flex px-5 py-2 border-t border-border text-[11px] text-muted-foreground justify-between items-center bg-card shrink-0">
          <span>© 2026 <strong className="text-foreground">Autodoc DZ</strong></span>
          <span>Hadji Khaoula · Amrane Leticia · Dev: Amrane Yousri</span>
        </footer>
      </div>
    </div>
  )
}
