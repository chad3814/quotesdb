"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"

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
          <div className="error px-4 py-3 rounded-lg border animate-fade-in">
            {error}
          </div>
        )}

        {result && (
          <div className="success px-4 py-3 rounded-lg border animate-fade-in">
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
          <label className="form-label flex items-center gap-2">
            <span className="text-xl">🎛️</span>
            Import Type
          </label>
          <div className="flex flex-col sm:flex-row gap-4">
            <label className="flex items-center gap-3 p-4 border border-border-light rounded-lg cursor-pointer transition-colors hover:bg-surface-100 has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50">
              <input
                type="radio"
                value="movie"
                checked={importType === "movie"}
                onChange={(e) => setImportType(e.target.value as ImportType)}
                className="w-4 h-4 text-primary-600"
                disabled={loading}
              />
              <div>
                <div className="font-medium text-text-primary flex items-center gap-2">
                  <span>🎬</span>
                  Single Movie
                </div>
                <div className="text-sm text-text-secondary">Import one movie by TMDB ID</div>
              </div>
            </label>
            
            <label className="flex items-center gap-3 p-4 border border-border-light rounded-lg cursor-pointer transition-colors hover:bg-surface-100 has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50">
              <input
                type="radio"
                value="list"
                checked={importType === "list"}
                onChange={(e) => setImportType(e.target.value as ImportType)}
                className="w-4 h-4 text-primary-600"
                disabled={loading}
              />
              <div>
                <div className="font-medium text-text-primary flex items-center gap-2">
                  <span>📄</span>
                  Movie List
                </div>
                <div className="text-sm text-text-secondary">Import multiple movies from a list</div>
              </div>
            </label>
          </div>
        </div>

        {importType === "movie" ? (
          <div>
            <label htmlFor="tmdbId" className="form-label flex items-center gap-2">
              <span>🎬</span>
              TMDB Movie ID
            </label>
            <input
              type="text"
              id="tmdbId"
              value={tmdbId}
              onChange={(e) => setTmdbId(e.target.value)}
              placeholder="e.g., 550 (for Fight Club)"
              required
              className="form-input"
              disabled={loading}
            />
          </div>
        ) : (
          <div>
            <label htmlFor="listId" className="form-label flex items-center gap-2">
              <span>📄</span>
              TMDB List ID
            </label>
            <input
              type="text"
              id="listId"
              value={listId}
              onChange={(e) => setListId(e.target.value)}
              placeholder="e.g., 7060919"
              required
              className="form-input"
              disabled={loading}
            />
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-border-light">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
            disabled={loading}
            className="order-2 sm:order-1"
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
            disabled={loading || (importType === "movie" ? !tmdbId.trim() : !listId.trim())}
            loading={loading}
            className="order-1 sm:order-2"
          >
            {loading ? "Importing..." : `Import ${importType === "movie" ? "Movie" : "List"}`}
          </Button>
        </div>
      </form>
    </div>
  )
}