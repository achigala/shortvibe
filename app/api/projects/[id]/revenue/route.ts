import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

// GET - Fetch revenues for a project
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params

    const revenues = await prisma.revenue.findMany({
        where: { projectId: id },
        orderBy: { date: "desc" },
    })

    return NextResponse.json(revenues)
}

// POST - Add revenue to a project (BOSS/DEV only)
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const isBossOrDev = session.user.role === "BOSS" || session.user.role === "DEVELOPER"
    if (!isBossOrDev) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    // Get project to find clientId
    const project = await prisma.project.findUnique({
        where: { id },
        select: { clientId: true, name: true },
    })

    if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const revenue = await prisma.revenue.create({
        data: {
            clientId: project.clientId,
            projectId: id,
            amount: parseFloat(body.amount),
            date: new Date(body.date),
            type: body.type || "รายได้โปรเจค",
            description: body.description || project.name,
        },
    })

    return NextResponse.json(revenue)
}

// DELETE - Remove a revenue entry (BOSS/DEV only)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const isBossOrDev = session.user.role === "BOSS" || session.user.role === "DEVELOPER"
    if (!isBossOrDev) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const revenueId = searchParams.get("revenueId")

    if (!revenueId) {
        return NextResponse.json({ error: "revenueId required" }, { status: 400 })
    }

    await prisma.revenue.delete({ where: { id: revenueId } })

    return NextResponse.json({ success: true })
}
