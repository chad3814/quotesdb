"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type ImportType = "movie" | "list"

interface ImportResult {
  movie?: {
    id: string
    title: string
    releaseYear: number | null
    imdbId?: string | null
  }
  created: boolean
  actorsAdded?: number
  error?: string | null
  message?: string
}

interface ListImportResult {
  listName: string
  listDescription?: string
  summary: {
    total: number
    added: number
    existing: number
    errors: number
    actorsAdded?: number
  }
  movies: ImportResult[]
}

export default function AddMoviesForm() {
  const router = useRouter()
  const [importType, setImportType] = useState<ImportType>("movie")
  const [tmdbId, setTmdbId] = useState("")
  const [listId, setListId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ImportResult | ListImportResult | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const body = importType === "movie" 
        ? { tmdbId: tmdbId.trim() }
        : { listId: listId.trim() }

      const response = await fetch("/api/movies/tmdb", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to import movies")
      }

      setResult(data)
      
      // Clear the form
      setTmdbId("")
      setListId("")
    } catch (error) {
      console.error("Error importing movies:", error)
      setError(error instanceof Error ? error.message : "Failed to import movies")
    } finally {
      setLoading(false)
    }
  }

  const isListResult = (r: ImportResult | ListImportResult | null): r is ListImportResult => {
    return r !== null && "listName" in r
  }

  return (
    <div className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {result && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {isListResult(result) ? (
              <div>
                <p className="font-semibold">{result.listName}</p>
                {result.listDescription && (
                  <p className="text-sm mt-1">{result.listDescription}</p>
                )}
                <div className="mt-2 text-sm">
                  <p>Total movies: {result.summary.total}</p>
                  <p>✅ Added: {result.summary.added}</p>
                  <p>📚 Already exists: {result.summary.existing}</p>
                  {result.summary.actorsAdded && result.summary.actorsAdded > 0 && (
                    <p>🎭 Actors added: {result.summary.actorsAdded}</p>
                  )}
                  {result.summary.errors > 0 && (
                    <p>❌ Errors: {result.summary.errors}</p>
                  )}
                </div>
                {result.summary.added > 0 && (
                  <div className="mt-3">
                    <p className="font-semibold text-sm">Newly added movies:</p>
                    <ul className="list-disc list-inside text-sm mt-1">
                      {result.movies
                        .filter(m => m.created && m.movie)
                        .map((m) => (
                          <li key={m.movie!.id}>
                            {m.movie!.title} {m.movie!.releaseYear && `(${m.movie!.releaseYear})`}
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p>{result.message || "Movie imported successfully"}</p>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Import Type
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="movie"
                checked={importType === "movie"}
                onChange={(e) => setImportType(e.target.value as ImportType)}
                className="mr-2"
                disabled={loading}
              />
              <span>Single Movie</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="list"
                checked={importType === "list"}
                onChange={(e) => setImportType(e.target.value as ImportType)}
                className="mr-2"
                disabled={loading}
              />
              <span>Movie List</span>
            </label>
          </div>
        </div>

        {importType === "movie" ? (
          <div>
            <label htmlFor="tmdbId" className="block text-sm font-medium text-gray-700 mb-2">
              TMDB Movie ID
            </label>
            <input
              type="text"
              id="tmdbId"
              value={tmdbId}
              onChange={(e) => setTmdbId(e.target.value)}
              placeholder="e.g., 550 (for Fight Club)"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>
        ) : (
          <div>
            <label htmlFor="listId" className="block text-sm font-medium text-gray-700 mb-2">
              TMDB List ID
            </label>
            <input
              type="text"
              id="listId"
              value={listId}
              onChange={(e) => setListId(e.target.value)}
              placeholder="e.g., 7060919"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || (importType === "movie" ? !tmdbId.trim() : !listId.trim())}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Importing..." : `Import ${importType === "movie" ? "Movie" : "List"}`}
          </button>
        </div>
      </form>
    </div>
  )
}