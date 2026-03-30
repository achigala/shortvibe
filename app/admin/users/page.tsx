import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { UserManagementClient } from "@/components/user-management-client"

export default async function UserApprovalPage() {
  const session = await auth()

  if (!session || session.user.role !== "BOSS") {
    redirect("/dashboard")
  }

  const currentUserId = (session.user as any).id as string

  const pendingUsers = await prisma.user.findMany({
    where: { isApproved: false },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, role: true },
  })

  const approvedUsers = await prisma.user.findMany({
    where: { isApproved: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, role: true },
  })

  return (
    <UserManagementClient
      pendingUsers={pendingUsers}
      approvedUsers={approvedUsers}
      currentUserId={currentUserId}
    />
  )
}
