import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth-utils"
import { addMovieFromTMDB, addMoviesFromTMDBList } from "@/lib/tmdb"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { tmdbId, listId } = body

    if (!tmdbId && !listId) {
      return NextResponse.json(
        { error: "Either tmdbId or listId is required" },
        { status: 400 }
      )
    }

    if (tmdbId && listId) {
      return NextResponse.json(
        { error: "Provide either tmdbId or listId, not both" },
        { status: 400 }
      )
    }

    // Add single movie by TMDB ID
    if (tmdbId) {
      const tmdbIdNum = parseInt(tmdbId)
      if (isNaN(tmdbIdNum)) {
        return NextResponse.json(
          { error: "Invalid TMDB ID" },
          { status: 400 }
        )
      }

      const result = await addMovieFromTMDB(tmdbIdNum)
      
      return NextResponse.json({
        success: true,
        movie: result.movie,
        created: result.created,
        actorsAdded: result.actorsAdded,
        message: result.created 
          ? `Added "${result.movie?.title}" to the database with ${result.actorsAdded} actors`
          : `"${result.movie?.title}" already exists in the database`
      })
    }

    // Add multiple movies from TMDB list
    if (listId) {
      const result = await addMoviesFromTMDBList(listId)
      
      const addedCount = result.results.filter(r => r.created).length
      const existingCount = result.results.filter(r => !r.created && !r.error).length
      const errorCount = result.results.filter(r => r.error).length
      const totalActorsAdded = result.results.reduce((sum, r) => sum + (r.actorsAdded || 0), 0)

      return NextResponse.json({
        success: true,
        listName: result.listName,
        listDescription: result.listDescription,
        summary: {
          total: result.results.length,
          added: addedCount,
          existing: existingCount,
          errors: errorCount,
          actorsAdded: totalActorsAdded
        },
        movies: result.results.map(r => ({
          movie: r.movie,
          created: r.created,
          actorsAdded: r.actorsAdded,
          error: r.error
        }))
      })
    }
  } catch (error) {
    console.error("Error adding movies from TMDB:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add movies" },
      { status: 500 }
    )
  }
}