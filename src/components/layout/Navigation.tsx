"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import AuthButton from "@/components/auth/AuthButton"
import { cn } from "@/lib/utils"

interface NavigationProps {
  className?: string
}

export default function Navigation({ className }: NavigationProps) {
  const pathname = usePathname()
  
  const navLinks = [
    { href: "/movies", label: "Movies", icon: "🎬" },
    { href: "/quotes", label: "Quotes", icon: "💬" },
  ]
  
  return (
    <nav className={cn("nav sticky top-0 z-50", className)}>
      <div className="container-main">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center">
            <Link href="/" className="nav-brand">
              <span className="flex items-center gap-2">
                <span className="text-2xl">📚</span>
                <span>QuotesDB</span>
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "nav-link flex items-center gap-2",
                  pathname.startsWith(link.href) && "nav-link-active"
                )}
              >
                <span className="text-lg">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
            
            <Link 
              href="/quotes/new" 
              className="btn btn-primary btn-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Quote
            </Link>
            
            <AuthButton />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
            <Link 
              href="/quotes/new" 
              className="btn btn-primary btn-sm"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </Link>
            <AuthButton />
          </div>
        </div>
      </div>
    </nav>
  )
}