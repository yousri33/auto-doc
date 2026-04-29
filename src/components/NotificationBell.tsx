import { useState } from 'react'
import { Bell, Zap, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { getDocStatus, cn } from '@/lib/utils'
import type { Vehicle } from '@/types'
import { WEBHOOK_URL } from '@/data/mock-data'

interface NotificationBellProps {
  vehicles: Vehicle[]
}

export function NotificationBell({ vehicles }: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const [sending, setSending] = useState<string | null>(null)
  const [sent, setSent] = useState<Record<string, boolean>>({})
  const [showSuccess, setShowSuccess] = useState(false)
  const [isSendingSummary, setIsSendingSummary] = useState(false)

  const allDocs = vehicles.flatMap(v =>
    v.documents.map(d => ({ ...d, vehicleName: v.name, vehiclePlate: v.plate, vehicleLogo: v.logo }))
  )
  const urgent = allDocs
    .filter(d => ['expiring', 'expired'].includes(getDocStatus(d.expiryDate)))
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())

  const unreadCount = urgent.filter(d => !sent[d.id]).length

  async function sendWebhook(doc: (typeof urgent)[0]) {
    setSending(doc.id)
    try {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'document_alert',
          vehicle: doc.vehicleName,
          plate: doc.vehiclePlate,
          documentType: doc.type,
          expiryDate: doc.expiryDate,
          status: getDocStatus(doc.expiryDate),
          sentAt: new Date().toISOString(),
          sentBy: 'Hadji Khaoula',
        }),
      })
    } catch {}
    setSent(prev => ({ ...prev, [doc.id]: true }))
    setSending(null)
  }

  async function sendToTeam() {
    setIsSendingSummary(true)
    try {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'team_alert_summary',
          totalUrgent: urgent.length,
          documents: urgent.map(d => ({
            vehicle: d.vehicleName, plate: d.vehiclePlate,
            documentType: d.type, expiryDate: d.expiryDate,
            status: getDocStatus(d.expiryDate),
          })),
          sentAt: new Date().toISOString(),
          sentBy: 'Hadji Khaoula',
          team: ['Amrane Leticia', 'Amrane Yousri'],
        }),
      })
    } catch {}
    
    setIsSendingSummary(false)
    setShowSuccess(true)
    
    const newSent: Record<string, boolean> = {}
    urgent.forEach(d => (newSent[d.id] = true))
    setSent(prev => ({ ...prev, ...newSent }))
    
    setTimeout(() => {
      setShowSuccess(false)
      setOpen(false)
    }, 2500)
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="relative w-9 h-9 rounded-lg border border-border bg-card flex items-center justify-center text-foreground hover:bg-muted transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-[17px] h-[17px] rounded-full bg-status-expired text-white text-[10px] font-bold flex items-center justify-center border-2 border-background">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[380px] p-0 overflow-hidden shadow-2xl border-slate-200"
          align="end"
          sideOffset={8}
        >
          {/* Header */}
          <div className="px-5 py-4 flex justify-between items-center bg-slate-50/50">
            <div>
              <p className="font-bold text-base text-slate-900 leading-none">Notifications</p>
              <p className="text-[12px] text-slate-500 mt-1.5 font-medium">
                {urgent.length === 0 ? 'Tout est à jour' : `${urgent.length} documents nécessitent attention`}
              </p>
            </div>
            {unreadCount > 0 && (
              <Badge variant="error" className="bg-red-50 text-red-600 border-red-100 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                {unreadCount} non lus
              </Badge>
            )}
          </div>

          <Separator className="opacity-50" />

          {/* List */}
          <ScrollArea className="max-h-[520px]">
            {urgent.length === 0 ? (
              <div className="py-12 flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                  <Check size={20} />
                </div>
                <p className="text-sm font-medium text-slate-500">Aucune alerte pour le moment</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {urgent.map((doc, idx) => {
                  const isSent = sent[doc.id]
                  const st = getDocStatus(doc.expiryDate)
                  const expired = st === 'expired'
                  
                  return (
                    <div
                      key={doc.id}
                      className="px-5 py-5 flex gap-4 items-center transition-colors hover:bg-slate-50/80 group"
                      style={{ opacity: isSent ? 0.6 : 1 }}
                    >
                      {/* Logo/Icon Container */}
                      <div className="relative shrink-0">
                        <div className="w-11 h-11 rounded-full flex items-center justify-center border border-slate-100 bg-white overflow-hidden shadow-sm transition-transform group-hover:scale-105">
                          {doc.vehicleLogo ? (
                            <img src={doc.vehicleLogo} alt="" className="h-full w-full object-contain p-1.5" />
                          ) : (
                            <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-400">
                              <Zap size={16} />
                            </div>
                          )}
                        </div>
                        <span
                          className="absolute -bottom-0.5 -right-0.5 block w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm"
                          style={{ background: expired ? 'hsl(var(--status-expired))' : 'hsl(var(--status-expiring))' }}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[14px] text-slate-900 truncate leading-tight group-hover:text-primary transition-colors">
                          {doc.vehicleName}
                          <span className="font-normal text-slate-400 ml-1.5 opacity-80">· {doc.type}</span>
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <p className="text-[11px] text-slate-500 font-bold font-mono uppercase tracking-wider">
                            {doc.vehiclePlate}
                          </p>
                          <span className="w-1 h-1 rounded-full bg-slate-300" />
                          <p className="text-[11px] text-slate-500 font-medium">
                            Exp: {new Date(doc.expiryDate).toLocaleDateString('fr-DZ', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </ScrollArea>

          {urgent.length > 0 && (
            <div className="p-5 bg-white border-t border-slate-100 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
              <Button 
                size="lg" 
                className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-[14px] font-bold shadow-md shadow-emerald-200 gap-2.5 transition-all active:scale-[0.98]" 
                onClick={sendToTeam}
                disabled={isSendingSummary}
              >
                {isSendingSummary ? (
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <><Zap size={16} fill="currentColor" /> Envoyer résumé au team</>
                )}
              </Button>
              <p className="text-[11px] text-slate-400 text-center mt-3 font-medium">
                Via webhook · Hadji Khaoula
              </p>
            </div>
          )}

        </PopoverContent>
      </Popover>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setShowSuccess(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-[320px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 p-8 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 mb-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}
                >
                  <Check size={32} strokeWidth={3} />
                </motion.div>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Notification envoyée !</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Le résumé a été envoyé avec succès à l'équipe via le webhook.
              </p>
              
              {/* Progress bar timer */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100">
                <motion.div
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 2.5, ease: "linear" }}
                  className="h-full bg-emerald-500"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
