"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"

interface Movie {
  id: string
  title: string
  releaseYear: number | null
  characterPortrayals: Array<{
    id: string
    character: {
      id: string
      name: string
    }
    actor: {
      id: string
      name: string
    }
  }>
}

interface QuoteLine {
  content: string
  characterId: string
  lineType: "DIALOGUE" | "STAGE_DIRECTION" | "NARRATION"
}

interface NewQuoteFormProps {
  userId: string
}

export default function NewQuoteForm({ userId }: NewQuoteFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Movie[]>([])
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [searching, setSearching] = useState(false)
  const [quoteLines, setQuoteLines] = useState<QuoteLine[]>([
    { content: "", characterId: "", lineType: "DIALOGUE" }
  ])

  // Check if movieId was passed in URL
  useEffect(() => {
    const movieId = searchParams.get("movieId")
    if (movieId) {
      // Fetch the movie details
      fetch(`/api/movies?id=${movieId}`)
        .then(res => res.json())
        .then(data => {
          if (data.movie) {
            setSelectedMovie(data.movie)
          }
        })
        .catch(console.error)
    }
  }, [searchParams])

  // Search for movies
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 2) {
        setSearching(true)
        try {
          const response = await fetch(`/api/movies/search?q=${encodeURIComponent(searchQuery)}`)
          const data = await response.json()
          setSearchResults(data.movies || [])
        } catch (error) {
          console.error("Error searching movies:", error)
        } finally {
          setSearching(false)
        }
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Filter out empty lines
    const nonEmptyLines = quoteLines.filter(line => line.content.trim())
    
    if (nonEmptyLines.length === 0) {
      setError("Please add at least one line of dialogue")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          movieId: selectedMovie?.id || null,
          lines: nonEmptyLines,
          createdBy: userId,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create quote")
      }

      if (selectedMovie) {
        router.push(`/movies/${selectedMovie.id}`)
      } else {
        router.push("/quotes")
      }
      router.refresh()
    } catch (error) {
      console.error("Error creating quote:", error)
      setError(error instanceof Error ? error.message : "Failed to create quote")
    } finally {
      setLoading(false)
    }
  }

  const addLine = () => {
    setQuoteLines([...quoteLines, { content: "", characterId: "", lineType: "DIALOGUE" }])
  }

  const removeLine = (index: number) => {
    if (quoteLines.length > 1) {
      setQuoteLines(quoteLines.filter((_, i) => i !== index))
    }
  }

  const updateLine = (index: number, field: keyof QuoteLine, value: string) => {
    const updated = [...quoteLines]
    updated[index] = { ...updated[index], [field]: value }
    setQuoteLines(updated)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="error px-4 py-3 rounded-lg border animate-fade-in">
          {error}
        </div>
      )}

      {/* Movie Selection */}
      <div>
        <label htmlFor="movie" className="form-label flex items-center gap-2">
          <span className="text-xl">🎬</span>
          Select Movie
        </label>
        
        {selectedMovie ? (
          <div className="flex items-center justify-between p-4 bg-accent-50 border border-accent-200 rounded-lg animate-fade-in">
            <div>
              <p className="font-semibold text-text-primary">
                {selectedMovie.title}
                {selectedMovie.releaseYear && (
                  <span className="text-text-secondary ml-2">({selectedMovie.releaseYear})</span>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedMovie(null)
                setQuoteLines([{ content: "", characterId: "", lineType: "DIALOGUE" }])
              }}
              className="btn btn-ghost text-sm px-2 py-1 text-red-600 hover:text-red-800 hover:bg-red-50"
            >
              Remove
            </button>
          </div>
        ) : (
          <div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a movie..."
              className="form-input"
              disabled={loading}
            />
            
            {searching && (
              <div className="mt-2 flex items-center gap-2 text-sm text-text-muted">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-300 border-t-primary-600"></div>
                Searching...
              </div>
            )}
            
            {searchResults.length > 0 && (
              <div className="mt-2 max-h-60 overflow-y-auto border border-border-light rounded-lg shadow-minimal animate-fade-in">
                {searchResults.map((movie, index) => (
                  <button
                    key={movie.id}
                    type="button"
                    onClick={() => {
                      setSelectedMovie(movie)
                      setSearchQuery("")
                      setSearchResults([])
                    }}
                    className={cn(
                      "w-full text-left px-4 py-3 hover:bg-surface-100 transition-colors border-b border-border-light last:border-b-0",
                      "first:rounded-t-lg last:rounded-b-lg"
                    )}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🎬</span>
                      <div>
                        <p className="font-medium text-text-primary">
                          {movie.title}
                        </p>
                        {movie.releaseYear && (
                          <p className="text-sm text-text-muted">({movie.releaseYear})</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quote Lines */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <label className="form-label flex items-center gap-2">
            <span className="text-xl">💬</span>
            Quote Lines
          </label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addLine}
            className="text-primary-600 hover:text-primary-700"
          >
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Line
          </Button>
        </div>

        <div className="space-y-4">
          {quoteLines.map((line, index) => (
            <div key={index} className="border border-border-light rounded-lg p-5 bg-surface-50/50 animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-text-primary">Quote Line</span>
                </div>
                {quoteLines.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLine(index)}
                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                  >
                    Remove
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                {/* Line Type */}
                <div className="flex gap-3">
                  <select
                    value={line.lineType}
                    onChange={(e) => updateLine(index, "lineType", e.target.value)}
                    className="form-select text-sm min-w-0 flex-shrink-0"
                    disabled={loading}
                  >
                    <option value="DIALOGUE">Dialogue</option>
                    <option value="STAGE_DIRECTION">Stage Direction</option>
                    <option value="NARRATION">Narration</option>
                  </select>

                  {/* Character Selection - only for dialogue */}
                  {line.lineType === "DIALOGUE" && selectedMovie && selectedMovie.characterPortrayals.length > 0 && (
                    <select
                      value={line.characterId}
                      onChange={(e) => updateLine(index, "characterId", e.target.value)}
                      className="form-select flex-1 text-sm"
                      disabled={loading}
                    >
                      <option value="">-- Select character (optional) --</option>
                      {selectedMovie.characterPortrayals.map((portrayal) => (
                        <option key={portrayal.character.id} value={portrayal.character.id}>
                          {portrayal.character.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Line Content */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    {line.lineType === "DIALOGUE" ? "Dialogue" : line.lineType === "STAGE_DIRECTION" ? "Stage Direction" : "Narration"}
                  </label>
                  <textarea
                    value={line.content}
                    onChange={(e) => updateLine(index, "content", e.target.value)}
                    placeholder={
                      line.lineType === "STAGE_DIRECTION" 
                        ? "e.g., [Luke looks at the binary sunset]" 
                        : line.lineType === "NARRATION"
                        ? "e.g., A long time ago in a galaxy far, far away..."
                        : "Enter the dialogue..."
                    }
                    rows={3}
                    className="form-textarea"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

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
          disabled={loading || quoteLines.every(line => !line.content.trim())}
          loading={loading}
          className="order-1 sm:order-2"
        >
          {loading ? "Creating..." : "Create Quote"}
        </Button>
      </div>
    </form>
  )
}