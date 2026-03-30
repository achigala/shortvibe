import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { createNotificationForMany } from "@/lib/notifications"

// PUT - Update task (progress, status, assignees)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; taskId: string }> }
) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { taskId } = await params
    const body = await request.json()

    const data: any = {}
    if (body.name !== undefined) data.name = body.name
    if (body.description !== undefined) data.description = body.description
    if (body.progress !== undefined) data.progress = body.progress
    if (body.statusId !== undefined) data.statusId = body.statusId
    if (body.categoryId !== undefined) data.categoryId = body.categoryId || null
    if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null
    if (body.isClosed !== undefined) {
        data.isClosed = body.isClosed
        if (body.isClosed) data.closedAt = new Date()
    }

    // Update assignees if provided
    if (body.assigneeIds) {
        // Get existing assignees before update
        const existingAssignees = await prisma.taskAssignee.findMany({
            where: { taskId },
            select: { userId: true },
        })
        const existingIds = existingAssignees.map(a => a.userId)

        await prisma.taskAssignee.deleteMany({ where: { taskId } })
        await prisma.taskAssignee.createMany({
            data: body.assigneeIds.map((userId: string) => ({ taskId, userId })),
        })

        // Notify newly added assignees
        const { id: projectId } = await params
        const newAssigneeIds = (body.assigneeIds as string[]).filter(uid => !existingIds.includes(uid))
        if (newAssigneeIds.length > 0) {
            const taskInfo = await prisma.task.findUnique({ where: { id: taskId }, select: { name: true } })
            await createNotificationForMany(newAssigneeIds, {
                type: "TASK_ASSIGN",
                title: "มีงานมอบหมายให้คุณ",
                message: `งาน "${taskInfo?.name || "ไม่ระบุ"}"`,
                link: `/projects/${projectId}`,
            })
        }
    }

    const task = await prisma.task.update({
        where: { id: taskId },
        data,
        include: {
            assignees: { include: { user: true } },
            category: true,
            comments: { include: { user: true } },
            attachments: true,
        },
    })

    return NextResponse.json(task)
}

// DELETE - Delete task
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; taskId: string }> }
) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { taskId } = await params
    await prisma.task.delete({ where: { id: taskId } })
    return NextResponse.json({ success: true })
}
