import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import type { ReactNode } from "react"

interface StatCardProps {
  label: string
  value: string | number
  description?: string
  icon?: ReactNode
  iconTooltip?: string
  accentColor?: string
  progress?: number
  trend?: "up" | "down" | "neutral"
}

export function StatCard({ label, value, description, icon, iconTooltip, accentColor, progress, trend }: StatCardProps) {
  const trendIcon = trend === "up" ? "↑" : trend === "down" ? "↓" : null
  const trendClass = trend === "up" ? "text-status-valid" : trend === "down" ? "text-status-expired" : ""

  return (
    <TooltipProvider delayDuration={300}>
      <Card className="flex-1 min-w-[130px] hover:shadow-md transition-shadow duration-200">
        <CardContent className="px-4 pt-3.5 pb-3">
          <div className="flex justify-between items-start mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {label}
            </span>
            {icon && (
              iconTooltip ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 cursor-default"
                      style={{
                        background: accentColor ? `${accentColor}18` : "hsl(var(--muted))",
                        color: accentColor || "hsl(var(--muted-foreground))",
                      }}
                    >
                      {icon}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>{iconTooltip}</TooltipContent>
                </Tooltip>
              ) : (
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                  style={{
                    background: accentColor ? `${accentColor}18` : "hsl(var(--muted))",
                    color: accentColor || "hsl(var(--muted-foreground))",
                  }}
                >
                  {icon}
                </div>
              )
            )}
          </div>

          <div className="flex items-baseline gap-1.5">
            <span
              className="text-2xl font-bold leading-none tabular-nums"
              style={{ color: accentColor || "hsl(var(--foreground))" }}
            >
              {value}
            </span>
            {trendIcon && (
              <span className={`text-xs font-semibold ${trendClass}`}>{trendIcon}</span>
            )}
          </div>

          {description && (
            <p className="text-[11px] text-muted-foreground mt-1">{description}</p>
          )}

          {progress !== undefined && (
            <Progress
              value={progress}
              className="mt-2.5 h-1"
              style={{ "--progress-color": accentColor } as React.CSSProperties}
            />
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
