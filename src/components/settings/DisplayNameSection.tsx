"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"

interface DisplayNameSectionProps {
  user: {
    id: string
    displayName: string | null
  }
}

export default function DisplayNameSection({ user }: DisplayNameSectionProps) {
  const { data: session, update } = useSession()
  const [isEditing, setIsEditing] = useState(false)
  const [displayName, setDisplayName] = useState(user.displayName || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleEdit = () => {
    setIsEditing(true)
    setError(null)
    setSuccess(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setDisplayName(user.displayName || "")
    setError(null)
    setSuccess(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch("/api/user/update-display-name", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ displayName: displayName.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update display name")
      }

      // Update the session with the new display name
      if (session) {
        await update({
          ...session,
          user: {
            ...session.user,
            displayName: displayName.trim(),
          },
        })
      }

      setSuccess(true)
      setIsEditing(false)
      
      // Refresh the page to update the UI
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError("Unable to update display name. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setDisplayName(value)
    
    // Clear error and success when user starts typing
    if (error) setError(null)
    if (success) setSuccess(false)
    
    // Real-time validation
    if (value.length > 15) {
      setError("Display name must be 15 characters or less")
    }
  }

  const isValid = displayName.trim().length > 0 && displayName.length <= 15 && !error

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Display Name</h3>
        
        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            Display name updated successfully!
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {!isEditing ? (
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-700">Current display name</div>
              <div className="mt-1 text-lg text-gray-900">
                {user.displayName || "Not set"}
              </div>
            </div>
            <button
              onClick={handleEdit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Edit
            </button>
          </div>
        ) : (
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

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isValid || loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}