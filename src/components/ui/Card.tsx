import { ReactNode, HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  children: ReactNode
  className?: string
  variant?: "default" | "elevated" | "floating"
  padding?: "none" | "sm" | "md" | "lg"
  hover?: boolean
}

export function Card({ 
  children, 
  className, 
  variant = "default",
  padding = "md",
  hover = false,
  ...props
}: CardProps) {
  const variants = {
    default: "card",
    elevated: "card-elevated", 
    floating: "card-floating"
  }
  
  const paddings = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8"
  }
  
  return (
    <div 
      className={cn(
        variants[variant],
        paddings[padding],
        hover && "transition-all duration-200 hover:shadow-elevated hover:-translate-y-1",
        "animate-in",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  children: ReactNode
  className?: string
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn("mb-4", className)}>
      {children}
    </div>
  )
}

interface CardTitleProps {
  children: ReactNode
  className?: string
  level?: 1 | 2 | 3 | 4 | 5
}

export function CardTitle({ children, className, level = 3 }: CardTitleProps) {
  const levels = {
    1: "heading-1",
    2: "heading-2", 
    3: "heading-3",
    4: "heading-4",
    5: "heading-5"
  }
  
  return (
    <h2 className={cn(levels[level], className)}>
      {children}
    </h2>
  )
}

interface CardContentProps {
  children: ReactNode
  className?: string
}

export function CardContent({ children, className }: CardContentProps) {
  return (
    <div className={cn("text-body", className)}>
      {children}
    </div>
  )
}

interface CardFooterProps {
  children: ReactNode
  className?: string
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={cn("mt-6 pt-4 border-t border-border-light", className)}>
      {children}
    </div>
  )
}