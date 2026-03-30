import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { createNotificationForMany } from "@/lib/notifications"

// POST - Create task
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const body = await request.json()

    // Resolve user ID (fallback to email lookup if session.user.id doesn't match DB)
    let creatorId = (session.user as any).id as string | undefined
    if (!creatorId || !(await prisma.user.findUnique({ where: { id: creatorId } }))) {
        const userByEmail = await prisma.user.findUnique({ where: { email: session.user.email! } })
        if (!userByEmail) return NextResponse.json({ error: "User not found" }, { status: 404 })
        creatorId = userByEmail.id
    }

    const task = await prisma.task.create({
        data: {
            projectId: id,
            name: body.name,
            description: body.description || null,
            categoryId: body.categoryId || null,
            dueDate: body.dueDate ? new Date(body.dueDate) : null,
            statusId: "TASK_STATUS-1",
            createdById: creatorId,
            assignees: body.assigneeIds?.length ? {
                create: body.assigneeIds.map((userId: string) => ({ userId })),
            } : undefined,
        },
        include: {
            assignees: { include: { user: true } },
            createdBy: true,
            category: true,
            comments: { include: { user: true } },
            attachments: true,
        },
    })

    // Notify assignees
    const assigneeIds: string[] = body.assigneeIds || []
    const notifyIds = assigneeIds.filter((uid: string) => uid !== creatorId)
    if (notifyIds.length > 0) {
        await createNotificationForMany(notifyIds, {
            type: "TASK_ASSIGN",
            title: "มีงานใหม่มอบหมายให้คุณ",
            message: `งาน "${body.name}" ในโปรเจค`,
            link: `/projects/${id}`,
        })
    }

    return NextResponse.json(task)
}
