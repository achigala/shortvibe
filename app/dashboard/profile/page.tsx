import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { ProfileClient } from "@/components/profile-client"

export default async function ProfilePage() {
  const session = await auth()
  if (!session) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      firstName: true,
      lastName: true,
      displayName: true,
      nickname: true,
      phone: true,
      position: true,
      bio: true,
      skills: true,
      gender: true,
      birthday: true,
      address: true,
      fatherName: true,
      motherName: true,
      salaryAccountNo: true,
      idCardImageUrl: true,
      avatar: true,
      maritalStatus: true,
      themeColor: true,
      createdAt: true,
    },
  })

  if (!user) redirect("/login")

  const serializedUser = {
    ...user,
    birthday: user.birthday?.toISOString() || null,
    createdAt: user.createdAt.toISOString(),
  }

  return <ProfileClient user={serializedUser} />
}
