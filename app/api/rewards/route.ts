import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const role = session.user.role
  if (role !== "BOSS" && role !== "DEVELOPER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const rewards = await prisma.reward.findMany({
      where: { isActive: true },
      include: {
        createdBy: {
          select: { id: true, name: true, nickname: true },
        },
        assignments: {
          where: { isActive: true },
          include: {
            user: {
              select: { id: true, name: true, nickname: true, avatar: true },
            },
            claims: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(rewards)
  } catch (error) {
    console.error("Failed to fetch rewards:", error)
    return NextResponse.json({ error: "Failed to fetch rewards" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const role = session.user.role
  if (role !== "BOSS" && role !== "DEVELOPER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { name, description, amount, frequency } = await request.json()
    const userId = (session.user as any).id as string

    const reward = await prisma.reward.create({
      data: {
        name,
        description: description || null,
        amount: parseFloat(amount),
        frequency,
        createdById: userId,
      },
    })

    return NextResponse.json(reward)
  } catch (error) {
    console.error("Failed to create reward:", error)
    return NextResponse.json({ error: "Failed to create reward" }, { status: 500 })
  }
}
