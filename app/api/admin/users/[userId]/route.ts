import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { hash } from "bcryptjs"
import { NextRequest, NextResponse } from "next/server"

// PUT - Approve user or Reset password
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    const session = await auth()
    if (!session || session.user.role !== "BOSS") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { userId } = await params
    const body = await request.json()

    if (body.action === "approve") {
        await prisma.user.update({
            where: { id: userId },
            data: { isApproved: true },
        })
        return NextResponse.json({ success: true })
    }

    if (body.action === "reset-password") {
        const { newPassword } = body
        if (!newPassword || newPassword.length < 6) {
            return NextResponse.json({ error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" }, { status: 400 })
        }
        const hashedPassword = await hash(newPassword, 12)
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        })
        return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}

// DELETE - Delete or reject user
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    const session = await auth()
    if (!session || session.user.role !== "BOSS") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { userId } = await params
    const currentUserId = (session.user as any).id

    // Don't allow deleting yourself
    if (userId === currentUserId) {
        return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 })
    }

    // Delete related owned projects' tasks first
    const ownedProjects = await prisma.project.findMany({
        where: { ownerId: userId },
        select: { id: true },
    })

    if (ownedProjects.length > 0) {
        const projectIds = ownedProjects.map(p => p.id)
        await prisma.taskAttachment.deleteMany({ where: { task: { projectId: { in: projectIds } } } })
        await prisma.taskComment.deleteMany({ where: { task: { projectId: { in: projectIds } } } })
        await prisma.taskAssignee.deleteMany({ where: { task: { projectId: { in: projectIds } } } })
        await prisma.task.deleteMany({ where: { projectId: { in: projectIds } } })
        await prisma.projectMember.deleteMany({ where: { projectId: { in: projectIds } } })
        await prisma.revenue.deleteMany({ where: { client: { projects: { some: { id: { in: projectIds } } } } } })
        await prisma.project.deleteMany({ where: { ownerId: userId } })
    }

    // Unlink tasks created by this user
    await prisma.task.updateMany({
        where: { createdById: userId },
        data: { createdById: null },
    })

    // Delete the user (cascade handles projectMember, taskAssignee, taskComment, notifications)
    await prisma.user.delete({ where: { id: userId } })

    return NextResponse.json({ success: true })
}
