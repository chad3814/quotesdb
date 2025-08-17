import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth-utils"
import { prisma } from "@/lib/db"
import { LineType } from "@prisma/client"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!session.user.displayName) {
      return NextResponse.json({ error: "Profile setup required" }, { status: 400 })
    }

    const { lines, movieId } = await request.json()

    // Validate lines
    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json({ error: "At least one quote line is required" }, { status: 400 })
    }

    // Process and validate each line
    const processedLines = lines
      .map((line: { content?: unknown; lineType?: string; characterId?: string }, index: number) => {
        if (!line.content || typeof line.content !== "string" || !line.content.trim()) {
          return null
        }
        return {
          content: line.content.trim(),
          lineType: (line.lineType || "DIALOGUE") as LineType,
          orderIndex: index,
          characterId: line.characterId || null,
        }
      })
      .filter((line): line is NonNullable<typeof line> => line !== null)

    if (processedLines.length === 0) {
      return NextResponse.json({ error: "At least one non-empty quote line is required" }, { status: 400 })
    }

    // Create quote with movie connection if provided
    const quote = await prisma.quote.create({
      data: {
        createdBy: session.user.id,
        movieId: movieId || null,
        lines: {
          create: processedLines,
        },
      },
      include: {
        lines: true,
        creator: {
          select: {
            displayName: true,
          },
        },
      },
    })

    return NextResponse.json({ 
      success: true, 
      quote 
    })
  } catch (error) {
    console.error("Quote creation error:", error)
    return NextResponse.json(
      { error: "Unable to create quote. Please try again." },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const quotes = await prisma.quote.findMany({
      include: {
        lines: {
          include: {
            character: true,
          },
          orderBy: {
            orderIndex: "asc",
          },
        },
        movie: true,
        episode: {
          include: {
            season: {
              include: {
                tvShow: true,
              },
            },
          },
        },
        creator: {
          select: {
            displayName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({ quotes })
  } catch (error) {
    console.error("Error fetching quotes:", error)
    return NextResponse.json(
      { error: "Unable to fetch quotes" },
      { status: 500 }
    )
  }
}