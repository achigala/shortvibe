import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

// POST - Add comment to task
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; taskId: string }> }
) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { taskId } = await params
    const body = await request.json()

    // Try session user ID first, fallback to email lookup
    let userId = (session.user as any).id as string | undefined
    if (!userId || !(await prisma.user.findUnique({ where: { id: userId } }))) {
        const userByEmail = await prisma.user.findUnique({ where: { email: session.user.email! } })
        if (!userByEmail) return NextResponse.json({ error: "User not found" }, { status: 404 })
        userId = userByEmail.id
    }

    const comment = await prisma.taskComment.create({
        data: {
            taskId,
            userId,
            content: body.content,
        },
        include: { user: true },
    })

    return NextResponse.json(comment)
}
