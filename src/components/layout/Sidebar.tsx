import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard, Truck, FileText, Upload,
  ChevronLeft, ChevronRight, FileCheck2,
  Settings, LogOut, User, Sparkles, ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Page } from "@/types"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  InfoCard,
  InfoCardContent,
  InfoCardTitle,
  InfoCardDescription,
  InfoCardMedia,
  InfoCardFooter,
  InfoCardDismiss,
  InfoCardAction,
} from "@/components/ui/info-card"

interface SidebarProps {
  page: Page
  onNavigate: (p: Page) => void
  collapsed: boolean
  setCollapsed: (v: boolean) => void
  mobileOpen: boolean
}

const NAV_ITEMS = [
  { id: "dashboard" as Page, label: "Tableau de bord", icon: LayoutDashboard },
  { id: "vehicles"  as Page, label: "Véhicules",       icon: Truck },
  { id: "reports"   as Page, label: "Rapports",        icon: FileText },
  { id: "upload"    as Page, label: "Upload OCR",      icon: Upload },
]

export function Sidebar({ page, onNavigate, collapsed, setCollapsed, mobileOpen }: SidebarProps) {

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        className={cn(
          // Fixed viewport height, NEVER scrolls
          "flex flex-col h-screen shrink-0 overflow-hidden",
          "bg-sidebar border-r border-sidebar-border",
          "transition-[width] duration-[220ms] ease-[cubic-bezier(.4,0,.2,1)]",
          collapsed ? "w-[60px]" : "w-56",
          "fixed inset-y-0 left-0 z-50 md:relative md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className={cn(
          "flex items-center gap-3 border-b border-sidebar-border shrink-0 h-16 mb-2 relative overflow-hidden",
          collapsed ? "justify-center px-0" : "px-4",
        )}>
          {/* Subtle background glow for logo */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
          
          <motion.div 
            layout
            className={cn(
              "relative z-10 flex items-center justify-center transition-all duration-500 ease-in-out",
              collapsed ? "w-9 h-9" : "w-full h-10 px-1"
            )}
          >
            <motion.img 
              layout
              src="/logo1.png" 
              alt="Autodoc DZ" 
              className={cn(
                "w-full h-full object-contain brightness-0 invert opacity-90 transition-all duration-500",
                collapsed ? "scale-[2.4] translate-y-[3px]" : ""
              )} 
            />
          </motion.div>
        </div>

        {/* ── Nav — exact height, never scrolls ── */}
        <nav className="flex flex-col gap-0.5 p-2 pt-2.5 shrink-0">
          {!collapsed && (
            <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-muted">
              Navigation
            </div>
          )}
          {NAV_ITEMS.map(item => {
            const active = page === item.id
            const Icon = item.icon
            const btn = (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl border-none cursor-pointer text-[13px] relative group/item",
                  "transition-all duration-300 ease-out",
                  collapsed ? "justify-center px-0 py-2.5" : "px-3.5 py-2.5",
                  active
                    ? "bg-gradient-to-r from-emerald-600/20 to-emerald-600/5 text-emerald-400 font-bold shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                    : "bg-transparent text-sidebar-foreground/70 hover:bg-white/5 hover:text-white font-medium",
                )}
              >
                {/* Active indicator bar */}
                {active && (
                  <motion.div 
                    layoutId="active-nav"
                    className="absolute left-0 w-1 h-5 bg-emerald-500 rounded-r-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                
                <Icon 
                  size={18} 
                  className={cn(
                    "shrink-0 transition-all duration-300",
                    active ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]" : "group-hover/item:text-white"
                  )} 
                />
                {!collapsed && (
                  <>
                    <span className="whitespace-nowrap flex-1 text-left tracking-wide">{item.label}</span>
                    {active && (
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                    )}
                  </>
                )}
              </button>
            )

            if (collapsed) {
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>{btn}</TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">{item.label}</TooltipContent>
                </Tooltip>
              )
            }
            return <div key={item.id}>{btn}</div>
          })}
        </nav>

        {/* Spacer pushes footer to bottom */}
        <div className="flex-1" />

        {/* ── Footer ── */}
        <div className="border-t border-sidebar-border p-2 space-y-1.5 shrink-0">

          {/* InfoCard Promo */}
          {!collapsed && (
            <div className="px-2 pb-2">
              <InfoCard className="bg-sidebar-accent/30 border-sidebar-border/50 text-white p-3">
                <InfoCardContent>
                  <InfoCardTitle className="text-[13px] font-bold text-white flex items-center gap-1.5">
                    <Sparkles size={12} className="text-emerald-400" />
                    Nouvelle Dashboard
                  </InfoCardTitle>
                  <InfoCardDescription className="text-[11px] text-sidebar-foreground/60 leading-tight">
                    Expérience optimisée. Nouveaux outils. Même efficacité.
                  </InfoCardDescription>
                  <InfoCardMedia
                    shrinkHeight={80}
                    expandHeight={140}
                    media={[
                      { src: "/ocr-promo.png", alt: "OCR" },
                      { src: "/analytics-promo.png", alt: "Analytics" },
                      { src: "/report-promo.png", alt: "Reports" },
                    ]}
                  />
                </InfoCardContent>
              </InfoCard>
            </div>
          )}

          <Separator className="bg-sidebar-border/40" />

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "w-full flex items-center rounded-lg cursor-pointer transition-colors hover:bg-sidebar-accent/40 border-none",
                  collapsed ? "justify-center p-2" : "gap-2.5 px-2 py-1.5",
                )}
              >
                <Avatar className="w-6 h-6 shrink-0 border border-white/10">
                  <AvatarImage src="/profile.png" alt="Hadji Khaoula" />
                  <AvatarFallback className="bg-sidebar-primary text-white text-[9px] font-bold">
                    HK
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="min-w-0 text-left">
                    <div className="text-white text-[12px] font-semibold truncate leading-tight">Hadji Khaoula</div>
                    <div className="text-sidebar-muted text-[10px]">Co-fondatrice</div>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end" sideOffset={8} className="w-44">
              <DropdownMenuLabel className="text-xs">Mon compte</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-xs"><User size={12} /> Profil</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-xs"><Settings size={12} /> Paramètres</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-xs text-destructive focus:text-destructive">
                <LogOut size={12} /> Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "w-full flex items-center rounded-md border-none cursor-pointer py-1.5",
              "bg-transparent text-sidebar-muted hover:bg-sidebar-accent/30 hover:text-white transition-colors",
              collapsed ? "justify-center" : "justify-end px-2.5",
            )}
          >
            {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  )
}
