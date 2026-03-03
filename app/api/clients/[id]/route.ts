import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

// PUT - Update client
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session || (session.user.role !== "BOSS" && session.user.role !== "DEVELOPER")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const updated = await prisma.client.update({
        where: { id },
        data: {
            name: body.name,
            contactName: body.contactName || null,
            email: body.email || null,
            phone: body.phone || null,
            businessType: body.businessType || null,
        },
    })

    return NextResponse.json(updated)
}

// DELETE - Delete client
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session || (session.user.role !== "BOSS" && session.user.role !== "DEVELOPER")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    await prisma.client.delete({ where: { id } })

    return NextResponse.json({ success: true })
}
