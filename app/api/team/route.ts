import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { hash } from "bcryptjs"
import { NextRequest, NextResponse } from "next/server"

// Boss/Dev สร้างพนักงานใหม่ + auto approve
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user.role !== "BOSS" && session.user.role !== "DEVELOPER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { name, email, password, role, phone, position, nickname } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "กรุณากรอกชื่อ อีเมล และรหัสผ่าน" },
        { status: 400 }
      )
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: "อีเมลนี้ถูกใช้งานแล้ว" },
        { status: 400 }
      )
    }

    const hashedPassword = await hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "STAFF",
        phone: phone || null,
        position: position || null,
        nickname: nickname || null,
        isApproved: true, // auto-approve เมื่อ Boss เป็นคนเพิ่ม
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        nickname: true,
        phone: true,
        position: true,
        bio: true,
        skills: true,
        themeColor: true,
        createdAt: true,
        isApproved: true,
      },
    })

    return NextResponse.json({
      message: "เพิ่มพนักงานสำเร็จ",
      user: {
        ...user,
        createdAt: user.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error("Create team member error:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาด กรุณาลองใหม่" },
      { status: 500 }
    )
  }
}
