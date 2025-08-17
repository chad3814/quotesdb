"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import AuthModal from "./AuthModal"
import DisplayNameModal from "./DisplayNameModal"

interface SignInButtonProps {
  className?: string
  children?: React.ReactNode
}

export default function SignInButton({ className = "", children }: SignInButtonProps) {
  const { data: session, status } = useSession()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showDisplayNameModal, setShowDisplayNameModal] = useState(false)
  const [justAuthenticated, setJustAuthenticated] = useState(false)

  // Check if user needs to set up display name after authentication
  useEffect(() => {
    if (justAuthenticated && status === "authenticated" && session?.user) {
      if (!session.user.displayName) {
        setShowDisplayNameModal(true)
      }
      setJustAuthenticated(false)
    }
  }, [justAuthenticated, status, session])

  // Don't render if already signed in
  if (status === "authenticated") {
    return null
  }

  const handleSignInClick = () => {
    setShowAuthModal(true)
  }

  const handleAuthSuccess = () => {
    setShowAuthModal(false)
    // Mark that we just authenticated to trigger the useEffect
    setJustAuthenticated(true)
  }

  const handleDisplayNameComplete = () => {
    setShowDisplayNameModal(false)
    // Refresh the page to update the UI
    window.location.reload()
  }

  return (
    <>
      <button
        onClick={handleSignInClick}
        disabled={status === "loading"}
        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {status === "loading" ? "Loading..." : (children || "Sign In")}
      </button>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />

      <DisplayNameModal
        isOpen={showDisplayNameModal}
        onComplete={handleDisplayNameComplete}
      />
    </>
  )
}