import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

// PUT - Update project (assign owners, update info)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const body = await request.json()

    // Only Boss can assign owner
    if (body.ownerId && session.user.role !== "BOSS") {
        return NextResponse.json({ error: "Only Boss can assign owners" }, { status: 403 })
    }

    const data: any = {}
    if (body.name) data.name = body.name
    if (body.description !== undefined) data.description = body.description
    if (body.ownerId) data.ownerId = body.ownerId
    if (body.statusId) data.statusId = body.statusId
    if (body.startDate !== undefined) data.startDate = body.startDate ? new Date(body.startDate) : null
    if (body.endDate !== undefined) data.endDate = body.endDate ? new Date(body.endDate) : null

    const updated = await prisma.project.update({
        where: { id },
        data,
        include: { client: true, owner: true, status: true },
    })

    return NextResponse.json(updated)
}
