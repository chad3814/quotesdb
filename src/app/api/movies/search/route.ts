import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q")

    if (!query) {
      return NextResponse.json({ movies: [] })
    }

    const movies = await prisma.movie.findMany({
      where: {
        title: {
          contains: query,
          mode: "insensitive"
        }
      },
      include: {
        characterPortrayals: {
          include: {
            character: true,
            actor: true
          }
        }
      },
      take: 20,
      orderBy: [
        { releaseYear: "desc" },
        { title: "asc" }
      ]
    })

    return NextResponse.json({ movies })
  } catch (error) {
    console.error("Error searching movies:", error)
    return NextResponse.json(
      { error: "Unable to search movies" },
      { status: 500 }
    )
  }
}