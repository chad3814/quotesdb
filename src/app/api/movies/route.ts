import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")
    const limit = parseInt(searchParams.get("limit") || "100")
    const offset = parseInt(searchParams.get("offset") || "0")

    // If ID is provided, return single movie
    if (id) {
      const movie = await prisma.movie.findUnique({
        where: { id },
        include: {
          characterPortrayals: {
            include: {
              character: true,
              actor: true
            }
          },
          _count: {
            select: {
              quotes: true
            }
          }
        }
      })
      
      return NextResponse.json({ movie })
    }

    const movies = await prisma.movie.findMany({
      take: limit,
      skip: offset,
      orderBy: [
        { releaseYear: "desc" },
        { title: "asc" }
      ],
      include: {
        _count: {
          select: {
            quotes: true
          }
        }
      }
    })

    const total = await prisma.movie.count()

    return NextResponse.json({
      movies,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error("Error fetching movies:", error)
    return NextResponse.json(
      { error: "Unable to fetch movies" },
      { status: 500 }
    )
  }
}