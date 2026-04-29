import { Badge } from '@/components/ui/badge'
import type { DocStatus } from '@/types'

interface StatusBadgeProps {
  status: DocStatus
}

const CONFIG: Record<DocStatus, { variant: 'success' | 'warning' | 'error'; label: string; dot: string }> = {
  valid:    { variant: 'success', label: 'Valide',         dot: 'hsl(var(--status-valid))' },
  expiring: { variant: 'warning', label: 'Expire bientôt', dot: 'hsl(var(--status-expiring))' },
  expired:  { variant: 'error',   label: 'Expiré',         dot: 'hsl(var(--status-expired))' },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const c = CONFIG[status]
  return (
    <Badge variant={c.variant}>
      <span
        className="inline-block size-[5px] rounded-full shrink-0"
        style={{ background: c.dot }}
      />
      {c.label}
    </Badge>
  )
}
