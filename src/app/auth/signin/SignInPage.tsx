"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import AuthModal from "@/components/auth/AuthModal"
import DisplayNameModal from "@/components/auth/DisplayNameModal"

export default function SignInPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [showDisplayNameModal, setShowDisplayNameModal] = useState(false)
  
  const callbackUrl = searchParams.get("callbackUrl") || "/"

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      if (!session.user.displayName) {
        setShowDisplayNameModal(true)
      } else {
        router.push(callbackUrl)
      }
    }
  }, [status, session, router, callbackUrl])

  const handleAuthSuccess = () => {
    if (session?.user && !session.user.displayName) {
      setShowDisplayNameModal(true)
    } else {
      router.push(callbackUrl)
    }
  }

  const handleDisplayNameComplete = () => {
    setShowDisplayNameModal(false)
    router.push(callbackUrl)
  }

  const handleCancel = () => {
    router.push("/")
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
      </div>
    )
  }

  if (status === "authenticated" && session?.user?.displayName) {
    router.push(callbackUrl)
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            You need to sign in to access this page
          </p>
        </div>
      </div>

      <AuthModal
        isOpen={status !== "authenticated"}
        onClose={handleCancel}
        onSuccess={handleAuthSuccess}
      />

      <DisplayNameModal
        isOpen={showDisplayNameModal}
        onComplete={handleDisplayNameComplete}
      />
    </div>
  )
}