import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await auth()
        if (!session || (session.user.role !== "BOSS" && session.user.role !== "DEVELOPER")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const data = await req.json()

        const user = await prisma.user.update({
            where: { id },
            data: {
                name: data.name,
                phone: data.phone,
                role: data.role,
                position: data.position,
                bio: data.bio,
                skills: data.skills,
                nickname: data.nickname,
                themeColor: data.themeColor,
            },
        })

        return NextResponse.json({ message: "อัปเดตสำเร็จ", user })
    } catch (error) {
        console.error("Update user error:", error)
        return NextResponse.json(
            { error: "เกิดข้อผิดพลาด กรุณาลองใหม่" },
            { status: 500 }
        )
    }
}
