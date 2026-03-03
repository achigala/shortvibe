import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

// POST - Add link attachment to task
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; taskId: string }> }
) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { taskId } = await params
    const body = await request.json()

    const attachment = await prisma.taskAttachment.create({
        data: {
            taskId,
            type: "link",
            url: body.url,
            name: body.name || body.url,
        },
    })

    return NextResponse.json(attachment)
}
