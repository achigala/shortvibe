import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { createNotificationForMany } from "@/lib/notifications"

// GET - Get project members
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const members = await prisma.projectMember.findMany({
        where: { projectId: id },
        include: { user: true },
    })
    return NextResponse.json(members)
}

// PUT - Set project members (replace all)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session || session.user.role !== "BOSS") {
        return NextResponse.json({ error: "Only Boss can assign members" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const userIds: string[] = body.userIds || []

    // Get existing members before update
    const existingMembers = await prisma.projectMember.findMany({
        where: { projectId: id },
        select: { userId: true },
    })
    const existingUserIds = existingMembers.map(m => m.userId)

    // Delete existing members
    await prisma.projectMember.deleteMany({ where: { projectId: id } })

    // Create new members
    if (userIds.length > 0) {
        await prisma.projectMember.createMany({
            data: userIds.map(userId => ({ projectId: id, userId })),
        })
    }

    // Also set first member as owner if ownerId not set
    if (userIds.length > 0) {
        await prisma.project.update({
            where: { id },
            data: { ownerId: userIds[0] },
        })
    }

    // Notify newly added members
    const newMemberIds = userIds.filter(uid => !existingUserIds.includes(uid))
    if (newMemberIds.length > 0) {
        const project = await prisma.project.findUnique({ where: { id }, select: { name: true, client: { select: { name: true } } } })
        const projectName = project?.name || "โปรเจค"
        const clientName = project?.client?.name || ""
        await createNotificationForMany(newMemberIds, {
            type: "PROJECT_ASSIGN",
            title: "ถูกเพิ่มเข้าโปรเจค",
            message: `คุณถูกเพิ่มเข้าโปรเจค "${projectName}" ${clientName ? `(${clientName})` : ""}`,
            link: `/projects/${id}`,
        })
    }

    const members = await prisma.projectMember.findMany({
        where: { projectId: id },
        include: { user: true },
    })

    return NextResponse.json(members)
}
