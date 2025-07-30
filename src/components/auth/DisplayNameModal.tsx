"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"

interface DisplayNameModalProps {
  isOpen: boolean
  onComplete: () => void
}

export default function DisplayNameModal({ isOpen, onComplete }: DisplayNameModalProps) {
  const { data: session, update } = useSession()
  const [displayName, setDisplayName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen || !session?.user) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/setup-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ displayName: displayName.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to save display name")
      }

      // Update the session with the new display name
      await update({
        ...session,
        user: {
          ...session.user,
          displayName: displayName.trim(),
        },
      })

      onComplete()
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError("Unable to save display name. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setDisplayName(value)
    
    // Clear error when user starts typing
    if (error) setError(null)
    
    // Real-time validation
    if (value.length > 15) {
      setError("Display name must be 15 characters or less")
    }
  }

  const isValid = displayName.trim().length > 0 && displayName.length <= 15 && !error

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold mb-2">Welcome!</h2>
          <p className="text-gray-600">Please choose a display name to continue.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
              Display Name
            </label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={handleInputChange}
              placeholder="Enter your display name"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                error ? "border-red-500" : "border-gray-300"
              }`}
              maxLength={16} // Allow one extra character for validation message
              disabled={loading}
              autoFocus
            />
            <div className="mt-1 flex justify-between">
              <div className="text-xs text-gray-500">
                Maximum 15 characters
              </div>
              <div className={`text-xs ${displayName.length > 15 ? "text-red-500" : "text-gray-400"}`}>
                {displayName.length}/15
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!isValid || loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : "Continue"}
          </button>
        </form>

        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>Your display name will be visible to other users and must be unique.</p>
        </div>
      </div>
    </div>
  )
}