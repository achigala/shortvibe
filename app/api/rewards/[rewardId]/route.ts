import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { serverCache } from "@/lib/cache"

export async function PUT(
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
    const { name, description, amount, frequency } = await request.json()

    const reward = await prisma.reward.update({
      where: { id: rewardId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(frequency !== undefined && { frequency }),
      },
    })

    // Invalidate rewards cache
    serverCache.invalidate("rewards:")

    return NextResponse.json(reward)
  } catch (error) {
    console.error("Failed to update reward:", error)
    return NextResponse.json({ error: "Failed to update reward" }, { status: 500 })
  }
}

export async function DELETE(
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

    const reward = await prisma.reward.update({
      where: { id: rewardId },
      data: { isActive: false },
    })

    // Invalidate rewards cache + Next.js route cache
    serverCache.invalidate("rewards:")
    revalidatePath("/rewards")

    return NextResponse.json(reward)
  } catch (error) {
    console.error("Failed to delete reward:", error)
    return NextResponse.json({ error: "Failed to delete reward" }, { status: 500 })
  }
}
