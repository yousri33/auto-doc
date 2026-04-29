interface CircularProgressProps {
  value: number
  max?: number
  size?: number
  color?: string
  thickness?: number
}

export function CircularProgress({ value, max = 100, size = 120, color = 'hsl(var(--primary))', thickness = 8 }: CircularProgressProps) {
  const percent = Math.min((value / max) * 100, 100)
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="hsl(var(--muted))" strokeWidth={thickness}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={thickness}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-bold leading-none" style={{ fontSize: size * 0.22, color }}>
          {Math.round(percent)}%
        </span>
        <span
          className="font-medium uppercase tracking-widest text-muted-foreground mt-0.5"
          style={{ fontSize: size * 0.09 }}
        >
          Conformité
        </span>
      </div>
    </div>
  )
}
