import { ReactNode } from "react"
import Navigation from "./Navigation"
import { cn } from "@/lib/utils"

interface PageLayoutProps {
  children: ReactNode
  className?: string
  maxWidth?: "full" | "main" | "content" | "narrow"
  showNav?: boolean
}

export default function PageLayout({ 
  children, 
  className, 
  maxWidth = "main",
  showNav = true 
}: PageLayoutProps) {
  const containerClasses = {
    full: "",
    main: "container-main",
    content: "container-content", 
    narrow: "container-narrow"
  }

  return (
    <div className="min-h-screen bg-surface-50">
      {showNav && <Navigation />}
      <main className={cn("py-8", containerClasses[maxWidth], className)}>
        {children}
      </main>
    </div>
  )
}