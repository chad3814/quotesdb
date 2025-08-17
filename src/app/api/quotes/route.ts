import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth-utils"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!session.user.displayName) {
      return NextResponse.json({ error: "Profile setup required" }, { status: 400 })
    }

    const { content, character, movieTitle } = await request.json()

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ error: "Quote content is required" }, { status: 400 })
    }

    // For now, create a simple quote structure
    // In a full implementation, this would involve creating movies, characters, etc.
    const quote = await prisma.quote.create({
      data: {
        createdBy: session.user.id,
        lines: {
          create: {
            content: content.trim(),
            lineType: "DIALOGUE",
            orderIndex: 0,
            // Note: character relationship would be more complex in real implementation
          },
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
          orderBy: {
            orderIndex: "asc",
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