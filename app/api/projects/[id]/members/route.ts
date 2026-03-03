import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

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

    const members = await prisma.projectMember.findMany({
        where: { projectId: id },
        include: { user: true },
    })

    return NextResponse.json(members)
}
