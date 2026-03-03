import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

// POST - Create new client
export async function POST(request: NextRequest) {
    const session = await auth()
    if (!session || (session.user.role !== "BOSS" && session.user.role !== "DEVELOPER")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const client = await prisma.client.create({
        data: {
            name: body.name,
            contactName: body.contactName || null,
            email: body.email || null,
            phone: body.phone || null,
            businessType: body.businessType || null,
        },
    })

    return NextResponse.json(client)
}
