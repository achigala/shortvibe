import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const userId = (session.user as any).id as string

    const assignments = await prisma.rewardAssignment.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        reward: true,
        claims: {
          orderBy: { claimedAt: "desc" },
        },
      },
      orderBy: { assignedAt: "desc" },
    })

    return NextResponse.json(assignments)
  } catch (error) {
    console.error("Failed to fetch my rewards:", error)
    return NextResponse.json({ error: "Failed to fetch rewards" }, { status: 500 })
  }
}
