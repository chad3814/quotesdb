import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  className 
}: EmptyStateProps) {
  return (
    <div className={cn("text-center py-16", className)}>
      <div className="flex justify-center mb-6">
        <div className="flex items-center justify-center w-20 h-20 bg-surface-100 rounded-full text-4xl">
          {icon}
        </div>
      </div>
      
      <h3 className="heading-4 mb-3">{title}</h3>
      
      <p className="text-body-secondary max-w-md mx-auto mb-8">
        {description}
      </p>
      
      {action && (
        <div className="animate-scale-in">
          {action}
        </div>
      )}
    </div>
  )
}