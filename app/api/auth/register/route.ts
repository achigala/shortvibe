import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import prisma from "@/lib/prisma"
import { createNotificationForMany } from "@/lib/notifications"

export async function POST(req: Request) {
  try {
    const { name, email, password, role } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลให้ครบถ้วน" },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
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
        isApproved: role === "BOSS" ? true : false
      }
    })

    // Notify all BOSS users about new registration
    const userRole = role || "STAFF"
    if (userRole !== "BOSS") {
      try {
        const bossUsers = await prisma.user.findMany({
          where: { role: "BOSS", isApproved: true },
          select: { id: true },
        })
        console.log("[Register] Found BOSS users for notification:", bossUsers.length)
        if (bossUsers.length > 0) {
          await createNotificationForMany(
            bossUsers.map((b) => b.id),
            {
              type: "NEW_REGISTRATION",
              title: "สมาชิกใหม่รออนุมัติ",
              message: `${name} (${email}) ส่งคำขอเข้าระบบ`,
              link: "/admin/users",
            }
          )
        }
      } catch (notifError: any) {
        console.error("[Register] Notification error:", notifError?.message || notifError)
      }
    }

    return NextResponse.json({
      message: role === "BOSS"
        ? "ลงทะเบียนสำเร็จ"
        : "ลงทะเบียนสำเร็จ รอการอนุมัติจาก Boss",
      userId: user.id
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาด กรุณาลองใหม่" },
      { status: 500 }
    )
  }
}
