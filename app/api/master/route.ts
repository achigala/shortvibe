import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

// CREATE master data
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user.role !== "BOSS" && session.user.role !== "DEVELOPER")) {
    return unauthorized()
  }

  const { category, name } = await req.json()

  const maxOrder = await prisma.masterData.findFirst({
    where: { category },
    orderBy: { order: "desc" },
  })

  const item = await prisma.masterData.create({
    data: {
      category,
      name,
      order: (maxOrder?.order || 0) + 1,
    },
  })

  return NextResponse.json(item)
}

// UPDATE master data
export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user.role !== "BOSS" && session.user.role !== "DEVELOPER")) {
    return unauthorized()
  }

  const { id, name } = await req.json()

  const item = await prisma.masterData.update({
    where: { id },
    data: { name },
  })

  return NextResponse.json(item)
}

// DELETE master data
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user.role !== "BOSS" && session.user.role !== "DEVELOPER")) {
    return unauthorized()
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 })
  }

  await prisma.masterData.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
