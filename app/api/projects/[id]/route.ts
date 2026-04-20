import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { serverCache } from "@/lib/cache"

// PUT - Update project (assign owners, update info)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const body = await request.json()

    // [C3] Only BOSS, DEVELOPER, or the project owner can edit project info
    const isBoss = session.user.role === "BOSS"
    const isDeveloper = session.user.role === "DEVELOPER"

    if (!isBoss && !isDeveloper) {
        // Check if the current user is the project owner
        const project = await prisma.project.findUnique({
            where: { id },
            select: { ownerId: true },
        })
        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 })
        }
        if (project.ownerId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }
    }

    // Only BOSS can assign/change owner
    if (body.ownerId && !isBoss) {
        return NextResponse.json({ error: "Only Boss can assign owners" }, { status: 403 })
    }

    const data: any = {}
    if (body.name) data.name = body.name
    if (body.description !== undefined) data.description = body.description
    if (body.ownerId) data.ownerId = body.ownerId
    if (body.statusId) data.statusId = body.statusId
    if (body.startDate !== undefined) data.startDate = body.startDate ? new Date(body.startDate) : null
    if (body.endDate !== undefined) data.endDate = body.endDate ? new Date(body.endDate) : null
    if (body.budget !== undefined) data.budget = body.budget !== null && body.budget !== "" ? parseFloat(body.budget) : null

    const updated = await prisma.project.update({
        where: { id },
        data,
        include: { client: true, owner: true, status: true },
    })

    // Invalidate caches
    serverCache.invalidate("projects:")
    serverCache.invalidate("dashboard:")
    serverCache.invalidate("pending:")

    return NextResponse.json(updated)
}

// DELETE - Remove project (BOSS/DEVELOPER only)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const role = session.user.role
    if (role !== "BOSS" && role !== "DEVELOPER") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params

    // Schema cascade gap: Task and Revenue have no onDelete: Cascade,
    // so we must delete them explicitly before the project.
    // ProjectMember + Task's own children (TaskAssignee/Comment/Attachment) cascade.
    await prisma.$transaction([
        prisma.revenue.deleteMany({ where: { projectId: id } }),
        prisma.task.deleteMany({ where: { projectId: id } }),
        prisma.project.delete({ where: { id } }),
    ])

    serverCache.invalidate("projects:")
    serverCache.invalidate("dashboard:")
    serverCache.invalidate("pending:")

    return NextResponse.json({ ok: true })
}
