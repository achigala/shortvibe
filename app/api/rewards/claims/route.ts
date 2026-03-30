import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { createNotificationForMany } from "@/lib/notifications"

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
    const claims = await prisma.rewardClaim.findMany({
      where: { status: "PENDING" },
      include: {
        assignment: {
          include: {
            reward: true,
            user: {
              select: { id: true, name: true, nickname: true, avatar: true },
            },
          },
        },
        claimedBy: {
          select: { id: true, name: true, nickname: true, avatar: true },
        },
        reviewedBy: {
          select: { id: true, name: true, nickname: true },
        },
      },
      orderBy: { claimedAt: "desc" },
    })

    return NextResponse.json(claims)
  } catch (error) {
    console.error("Failed to fetch claims:", error)
    return NextResponse.json({ error: "Failed to fetch claims" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const userId = (session.user as any).id as string
    const { assignmentId, note } = await request.json()

    const assignment = await prisma.rewardAssignment.findUnique({
      where: { id: assignmentId },
      include: { reward: true },
    })

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
    }

    // Calculate period based on frequency
    const now = new Date()
    let period: string
    switch (assignment.reward.frequency) {
      case "MONTHLY":
        period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
        break
      case "YEARLY":
        period = `${now.getFullYear()}`
        break
      case "ONE_TIME":
        period = "once"
        break
      default:
        period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    }

    // Check if claim already exists for this period
    const existingClaim = await prisma.rewardClaim.findUnique({
      where: {
        assignmentId_period: {
          assignmentId,
          period,
        },
      },
    })

    if (existingClaim) {
      return NextResponse.json(
        { error: "คุณได้เคลมสวัสดิการรอบนี้ไปแล้ว" },
        { status: 400 }
      )
    }

    const claim = await prisma.rewardClaim.create({
      data: {
        assignmentId,
        claimedById: userId,
        period,
        note: note || null,
      },
    })

    // Notify all BOSS users
    const bossUsers = await prisma.user.findMany({
      where: { role: "BOSS" },
      select: { id: true },
    })

    const bossIds = bossUsers.map((u) => u.id)
    const userName = session.user.name || "ผู้ใช้"

    await createNotificationForMany(bossIds, {
      type: "REWARD_CLAIM",
      title: "มีการเคลมสวัสดิการ",
      message: `${userName} เคลมสวัสดิการ ${assignment.reward.name}`,
      link: "/rewards",
    })

    return NextResponse.json(claim)
  } catch (error) {
    console.error("Failed to create claim:", error)
    return NextResponse.json({ error: "Failed to create claim" }, { status: 500 })
  }
}
