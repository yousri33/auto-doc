import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  children?: ReactNode
}

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="px-4 md:px-7 pt-5 md:pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-lg md:text-xl font-bold text-foreground tracking-[-0.3px] leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 text-xs md:text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          {children}
        </div>
      )}
    </div>
  )
}
