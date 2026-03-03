import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function UserApprovalPage() {
  const session = await auth()

  if (!session || session.user.role !== "BOSS") {
    redirect("/dashboard")
  }

  const pendingUsers = await prisma.user.findMany({
    where: { isApproved: false },
    orderBy: { createdAt: "desc" }
  })

  const approvedUsers = await prisma.user.findMany({
    where: { isApproved: true },
    orderBy: { createdAt: "desc" },
    take: 10
  })

  const approveUser = async (userId: string) => {
    "use server"
    await prisma.user.update({
      where: { id: userId },
      data: { isApproved: true }
    })
  }

  const rejectUser = async (userId: string) => {
    "use server"
    await prisma.user.delete({
      where: { id: userId }
    })
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">จัดการผู้ใช้งาน</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>รอการอนุมัติ ({pendingUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingUsers.length === 0 ? (
              <p className="text-gray-500">ไม่มีผู้ใช้งานรออนุมัติ</p>
            ) : (
              <div className="space-y-4">
                {pendingUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <Badge variant="outline" className="mt-1">{user.role}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <form action={async () => {
                        "use server"
                        await approveUser(user.id)
                      }}>
                        <Button type="submit" size="sm" className="bg-green-600 hover:bg-green-700">
                          อนุมัติ
                        </Button>
                      </form>
                      <form action={async () => {
                        "use server"
                        await rejectUser(user.id)
                      }}>
                        <Button type="submit" size="sm" variant="destructive">
                          ปฏิเสธ
                        </Button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ผู้ใช้งานที่อนุมัติแล้ว</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {approvedUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <Badge>{user.role}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
