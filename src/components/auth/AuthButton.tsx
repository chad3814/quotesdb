"use client"

import { useSession } from "next-auth/react"
import SignInButton from "./SignInButton"
import SignOutButton from "./SignOutButton"

interface AuthButtonProps {
  className?: string
}

export default function AuthButton({ className }: AuthButtonProps) {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className={`inline-flex items-center px-4 py-2 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
        <span className="ml-2 text-sm">Loading...</span>
      </div>
    )
  }

  if (status === "authenticated" && session) {
    return (
      <div className="flex items-center space-x-3">
        <span className="text-sm text-gray-700">
          Welcome, {session.user.displayName || session.user.name || "User"}!
        </span>
        <SignOutButton className={className} />
      </div>
    )
  }

  return <SignInButton className={className} />
}