import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { createNotification } from "@/lib/notifications"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ claimId: string }> }
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
    const { claimId } = await params
    const { status, reviewNote } = await request.json()
    const reviewedById = (session.user as any).id as string

    const claim = await prisma.rewardClaim.update({
      where: { id: claimId },
      data: {
        status,
        reviewedById,
        reviewedAt: new Date(),
        reviewNote: reviewNote || null,
      },
      include: {
        assignment: {
          include: {
            reward: true,
          },
        },
        claimedBy: {
          select: { id: true, name: true },
        },
      },
    })

    const rewardName = claim.assignment.reward.name
    const claimerId = claim.claimedBy.id

    if (status === "APPROVED") {
      await createNotification({
        userId: claimerId,
        type: "REWARD_APPROVED",
        title: "สวัสดิการของคุณได้รับอนุมัติ",
        message: `สวัสดิการ ${rewardName} รอบ ${claim.period} ได้รับอนุมัติแล้ว`,
        link: "/rewards",
      })
    } else if (status === "REJECTED") {
      const rejectMessage = reviewNote
        ? `สวัสดิการ ${rewardName} รอบ ${claim.period} ถูกปฏิเสธ: ${reviewNote}`
        : `สวัสดิการ ${rewardName} รอบ ${claim.period} ถูกปฏิเสธ`

      await createNotification({
        userId: claimerId,
        type: "REWARD_REJECTED",
        title: "สวัสดิการของคุณถูกปฏิเสธ",
        message: rejectMessage,
        link: "/rewards",
      })
    }

    return NextResponse.json(claim)
  } catch (error) {
    console.error("Failed to review claim:", error)
    return NextResponse.json({ error: "Failed to review claim" }, { status: 500 })
  }
}
