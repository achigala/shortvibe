import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET - Fetch notifications for current user
export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Resolve user ID
  let userId = (session.user as any).id as string | undefined
  if (!userId) {
    const user = await prisma.user.findUnique({ where: { email: session.user.email! } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
    userId = user.id
  }

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.notification.count({
      where: { userId, isRead: false },
    }),
  ])

  return NextResponse.json({ notifications, unreadCount })
}

// PUT - Mark notifications as read
export async function PUT(req: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let userId = (session.user as any).id as string | undefined
  if (!userId) {
    const user = await prisma.user.findUnique({ where: { email: session.user.email! } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
    userId = user.id
  }

  const body = await req.json()

  if (body.markAllRead) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    })
  } else if (body.id) {
    await prisma.notification.update({
      where: { id: body.id, userId },
      data: { isRead: true },
    })
  }

  return NextResponse.json({ success: true })
}
