import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

// POST - Complete project (Boss only, all tasks must be done)
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session || session.user.role !== "BOSS") {
        return NextResponse.json({ error: "Only Boss can complete projects" }, { status: 403 })
    }

    const { id } = await params

    const doneStatus = await prisma.masterData.findFirst({
        where: { category: "PROJECT_STATUS", name: "เสร็จสิ้น" },
    })

    const updated = await prisma.project.update({
        where: { id },
        data: {
            isCompleted: true,
            statusId: doneStatus?.id || "PROJECT_STATUS-4",
        },
    })

    return NextResponse.json(updated)
}
