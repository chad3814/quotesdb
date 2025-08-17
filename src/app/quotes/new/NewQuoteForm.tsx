"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

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
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Movie Selection */}
      <div>
        <label htmlFor="movie" className="block text-sm font-medium text-gray-700 mb-2">
          Select Movie
        </label>
        
        {selectedMovie ? (
          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div>
              <p className="font-medium text-gray-900">
                {selectedMovie.title}
                {selectedMovie.releaseYear && (
                  <span className="text-gray-600 ml-2">({selectedMovie.releaseYear})</span>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedMovie(null)
                setQuoteLines([{ content: "", characterId: "", lineType: "DIALOGUE" }])
              }}
              className="text-sm text-red-600 hover:text-red-800"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
            
            {searching && (
              <p className="mt-2 text-sm text-gray-500">Searching...</p>
            )}
            
            {searchResults.length > 0 && (
              <div className="mt-2 max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                {searchResults.map((movie) => (
                  <button
                    key={movie.id}
                    type="button"
                    onClick={() => {
                      setSelectedMovie(movie)
                      setSearchQuery("")
                      setSearchResults([])
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <p className="font-medium text-gray-900">
                      {movie.title}
                      {movie.releaseYear && (
                        <span className="text-gray-600 ml-2">({movie.releaseYear})</span>
                      )}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quote Lines */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Quote Lines
          </label>
          <button
            type="button"
            onClick={addLine}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            + Add Line
          </button>
        </div>

        <div className="space-y-3">
          {quoteLines.map((line, index) => (
            <div key={index} className="border border-gray-200 rounded-md p-4">
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm font-medium text-gray-700">Line {index + 1}</span>
                {quoteLines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLine(index)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {/* Line Type */}
                <div className="flex gap-3">
                  <select
                    value={line.lineType}
                    onChange={(e) => updateLine(index, "lineType", e.target.value)}
                    className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

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
          disabled={loading || quoteLines.every(line => !line.content.trim())}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating..." : "Create Quote"}
        </button>  
      </div>
    </form>
  )
}