import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { createNotification } from "@/lib/notifications"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ rewardId: string }> }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const role = session.user.role
  if (role !== "BOSS" && role !== "DEVELOPER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { rewardId } = await params
    const { userIds } = await request.json()
    const assignedById = (session.user as any).id as string

    const reward = await prisma.reward.findUnique({
      where: { id: rewardId },
    })

    if (!reward) {
      return NextResponse.json({ error: "Reward not found" }, { status: 404 })
    }

    const results = []

    for (const userId of userIds) {
      try {
        const assignment = await prisma.rewardAssignment.upsert({
          where: {
            rewardId_userId: {
              rewardId,
              userId,
            },
          },
          update: {
            isActive: true,
          },
          create: {
            rewardId,
            userId,
            assignedById,
          },
        })
        results.push(assignment)

        await createNotification({
          userId,
          type: "REWARD_ASSIGN",
          title: "คุณได้รับสวัสดิการใหม่",
          message: `คุณได้รับสวัสดิการ "${reward.name}"`,
          link: "/rewards",
        })
      } catch (error) {
        console.error(`Failed to assign reward to user ${userId}:`, error)
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("Failed to assign reward:", error)
    return NextResponse.json({ error: "Failed to assign reward" }, { status: 500 })
  }
}
