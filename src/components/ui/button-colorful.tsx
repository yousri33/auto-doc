import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ArrowUpRight } from "lucide-react"

interface ButtonColorfulProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string
}

export function ButtonColorful({ className, label = "Explorer", ...props }: ButtonColorfulProps) {
  return (
    <Button
      className={cn(
        "relative h-9 px-4 overflow-hidden bg-zinc-900 transition-all duration-200 group",
        className,
      )}
      {...props}
    >
      <div className={cn(
        "absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500",
        "opacity-40 group-hover:opacity-80 blur transition-opacity duration-500",
      )} />
      <div className="relative flex items-center justify-center gap-1.5">
        <span className="text-white text-sm font-medium">{label}</span>
        <ArrowUpRight className="w-3.5 h-3.5 text-white/90" />
      </div>
    </Button>
  )
}
