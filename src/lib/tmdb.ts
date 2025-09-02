import { prisma } from "@/lib/db"
import { JobType } from "@prisma/client"
import * as jobService from "@/lib/jobs/jobService"

const TMDB_BASE_URL = "https://api.themoviedb.org/3"

function getTMDBApiKey() {
  const apiKey = process.env.TMDB_API_KEY
  if (!apiKey) {
    throw new Error("TMDB API key is not configured")
  }
  return apiKey
}

interface TMDBMovie {
  id: number
  title: string
  release_date?: string
  overview?: string
  poster_path?: string
  backdrop_path?: string
  imdb_id?: string
}

interface TMDBCast {
  id: number
  name: string
  character?: string
  order?: number
}

interface TMDBCredits {
  cast: TMDBCast[]
}

interface TMDBList {
  id: string
  name: string
  description?: string
  items: TMDBMovie[]
}

export async function fetchMovieFromTMDB(tmdbId: number): Promise<TMDBMovie | null> {
  const TMDB_API_KEY = getTMDBApiKey()

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=external_ids`
    )

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`TMDB API error: ${response.statusText}`)
    }

    const data = await response.json()
    // The external_ids are appended, extract IMDb ID if available
    if (data.external_ids?.imdb_id) {
      data.imdb_id = data.external_ids.imdb_id
    }
    
    return data
  } catch (error) {
    console.error(`Error fetching movie ${tmdbId} from TMDB:`, error)
    throw error
  }
}

export async function fetchMovieCredits(tmdbId: number): Promise<TMDBCredits | null> {
  const TMDB_API_KEY = getTMDBApiKey()

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${tmdbId}/credits?api_key=${TMDB_API_KEY}`
    )

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`TMDB API error: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Error fetching credits for movie ${tmdbId} from TMDB:`, error)
    throw error
  }
}

export async function fetchListFromTMDB(listId: string): Promise<TMDBList | null> {
  const TMDB_API_KEY = getTMDBApiKey()

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/list/${listId}?api_key=${TMDB_API_KEY}`
    )

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`TMDB API error: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Error fetching list ${listId} from TMDB:`, error)
    throw error
  }
}

export async function addMovieFromTMDB(tmdbId: number) {
  const tmdbMovie = await fetchMovieFromTMDB(tmdbId)
  
  if (!tmdbMovie) {
    throw new Error(`Movie with TMDB ID ${tmdbId} not found`)
  }

  // Check if movie already exists
  const existingMovie = await prisma.movie.findUnique({
    where: { tmdbId },
    include: {
      characterPortrayals: {
        include: {
          actor: true,
          character: true
        }
      }
    }
  })

  if (existingMovie) {
    return { 
      movie: existingMovie, 
      created: false,
      actorsAdded: 0
    }
  }

  // Extract release year from release_date
  const releaseYear = tmdbMovie.release_date 
    ? parseInt(tmdbMovie.release_date.split("-")[0]) 
    : null

  // Create new movie with IMDb ID and overview
  const movie = await prisma.movie.create({
    data: {
      title: tmdbMovie.title,
      overview: tmdbMovie.overview || null,
      releaseYear,
      tmdbId,
      imdbId: tmdbMovie.imdb_id || null
    }
  })

  // Queue IMDb quote fetching job if movie has an IMDb ID
  if (tmdbMovie.imdb_id) {
    try {
      await jobService.createJob({
        type: JobType.FETCH_IMDB_QUOTES,
        arguments: {
          movieId: movie.id,
          imdbId: tmdbMovie.imdb_id
        }
      })
      console.log(`Queued IMDb quote fetch job for movie ${movie.id} (IMDb: ${tmdbMovie.imdb_id})`)
    } catch (error) {
      console.error('Failed to queue IMDb quote fetch job:', error)
      // Don't throw - movie creation succeeded, job queue failure is non-critical
    }
  }

  // Fetch and add cast members
  let actorsAdded = 0
  try {
    const credits = await fetchMovieCredits(tmdbId)
    
    if (credits && credits.cast) {
      // Process top 20 cast members (or however many you want)
      const topCast = credits.cast.slice(0, 20)
      
      for (const castMember of topCast) {
        try {
          // Check if actor already exists
          let actor = await prisma.actor.findUnique({
            where: { tmdbId: castMember.id }
          })
          
          if (!actor) {
            // Create new actor
            actor = await prisma.actor.create({
              data: {
                name: castMember.name,
                tmdbId: castMember.id
              }
            })
            actorsAdded++
          }
          
          // Create character if specified and link via CharacterPortrayal
          if (castMember.character) {
            // Check if character exists
            let character = await prisma.character.findFirst({
              where: { 
                name: castMember.character
              }
            })
            
            if (!character) {
              // Create new character
              character = await prisma.character.create({
                data: {
                  name: castMember.character
                }
              })
            }
            
            // Create CharacterPortrayal linking actor, character, and movie
            await prisma.characterPortrayal.create({
              data: {
                characterId: character.id,
                actorId: actor.id,
                movieId: movie.id
              }
            }).catch(err => {
              // Ignore if portrayal already exists
              if (!err.message.includes('Unique constraint')) {
                throw err
              }
            })
          }
        } catch (error) {
          console.error(`Error adding cast member ${castMember.name}:`, error)
        }
      }
    }
  } catch (error) {
    console.error(`Error fetching/adding credits for movie ${tmdbId}:`, error)
  }

  // Return movie with relationships
  const movieWithRelations = await prisma.movie.findUnique({
    where: { id: movie.id },
    include: {
      characterPortrayals: {
        include: {
          actor: true,
          character: true
        }
      }
    }
  })

  return { 
    movie: movieWithRelations, 
    created: true,
    actorsAdded
  }
}

export async function addMoviesFromTMDBList(listId: string) {
  const tmdbList = await fetchListFromTMDB(listId)
  
  if (!tmdbList) {
    throw new Error(`List with TMDB ID ${listId} not found`)
  }

  const results = []
  
  for (const tmdbMovie of tmdbList.items) {
    try {
      // Use the full addMovieFromTMDB function to get actors too
      const result = await addMovieFromTMDB(tmdbMovie.id)
      results.push({ 
        movie: result.movie, 
        created: result.created, 
        actorsAdded: result.actorsAdded,
        error: null 
      })
    } catch (error) {
      console.error(`Error adding movie ${tmdbMovie.id}:`, error)
      results.push({ 
        movie: null, 
        created: false, 
        actorsAdded: 0,
        error: `Failed to add ${tmdbMovie.title}` 
      })
    }
  }

  return {
    listName: tmdbList.name,
    listDescription: tmdbList.description,
    results
  }
}