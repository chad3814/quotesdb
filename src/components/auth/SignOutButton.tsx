"use client"

import { useState } from "react"
import { signOut, useSession } from "next-auth/react"

interface SignOutButtonProps {
  className?: string
  children?: React.ReactNode
}

export default function SignOutButton({ className = "", children }: SignOutButtonProps) {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(false)

  // Don't render if not signed in
  if (status !== "authenticated" || !session) {
    return null
  }

  const handleSignOut = async () => {
    setLoading(true)
    try {
      await signOut({ 
        callbackUrl: window.location.origin,
        redirect: true 
      })
    } catch (error) {
      console.error("Sign out error:", error)
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className={`inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? "Signing out..." : (children || "Sign Out")}
    </button>
  )
}