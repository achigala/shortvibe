import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const data = await req.json()

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: data.name,
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        displayName: data.displayName || null,
        nickname: data.nickname || null,
        phone: data.phone || null,
        position: data.position || null,
        bio: data.bio || null,
        skills: data.skills || null,
        gender: data.gender || null,
        birthday: data.birthday ? new Date(data.birthday) : null,
        address: data.address || null,
        idCardImageUrl: data.idCardImageUrl || null,
        fatherName: data.fatherName || null,
        motherName: data.motherName || null,
        salaryAccountNo: data.salaryAccountNo || null,
        maritalStatus: data.maritalStatus || null,
        themeColor: data.themeColor || null,
        avatar: data.avatar || null,
      },
    })

    return NextResponse.json({ message: "อัปเดตสำเร็จ", user })
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 })
  }
}
