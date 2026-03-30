import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user.role !== "BOSS" && session.user.role !== "DEVELOPER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { name, description, clientId, ownerId, statusId, startDate, endDate, budget } = await req.json()

  const project = await prisma.project.create({
    data: {
      name,
      description: description || null,
      clientId,
      ownerId,
      statusId,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      budget: budget && parseFloat(budget) > 0 ? parseFloat(budget) : null,
    },
  })

  return NextResponse.json(project)
}
