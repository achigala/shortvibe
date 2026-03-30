"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { AlertTriangle, Trash2, CheckCircle, XCircle, KeyRound } from "lucide-react"

interface UserData {
  id: string
  name: string
  email: string
  role: string
}

interface Props {
  pendingUsers: UserData[]
  approvedUsers: UserData[]
  currentUserId: string
}

export function UserManagementClient({ pendingUsers, approvedUsers, currentUserId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [dialogState, setDialogState] = useState<{
    open: boolean
    type: "approve" | "reject" | "delete" | "reset-password" | null
    user: UserData | null
  }>({ open: false, type: null, user: null })

  const openDialog = (type: "approve" | "reject" | "delete" | "reset-password", user: UserData) => {
    setDialogState({ open: true, type, user })
    if (type === "reset-password") setNewPassword("")
  }

  const closeDialog = () => {
    setDialogState({ open: false, type: null, user: null })
    setNewPassword("")
  }

  const handleConfirm = async () => {
    if (!dialogState.user || !dialogState.type) return
    setLoading(true)

    try {
      const userId = dialogState.user.id

      if (dialogState.type === "approve") {
        await fetch(`/api/admin/users/${userId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "approve" }),
        })
      } else if (dialogState.type === "reset-password") {
        if (!newPassword || newPassword.length < 6) return
        const res = await fetch(`/api/admin/users/${userId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "reset-password", newPassword }),
        })
        if (!res.ok) {
          const data = await res.json()
          alert(data.error || "เกิดข้อผิดพลาด")
          return
        }
        alert(`รีเซ็ตรหัสผ่านสำเร็จสำหรับ "${dialogState.user.name}"`)
      } else {
        // reject or delete
        await fetch(`/api/admin/users/${userId}`, {
          method: "DELETE",
        })
      }

      closeDialog()
      router.refresh()
    } catch (error) {
      console.error("Action failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const getDialogContent = () => {
    if (!dialogState.user || !dialogState.type) return { title: "", message: "", confirmText: "", icon: null }

    switch (dialogState.type) {
      case "approve":
        return {
          title: "ยืนยันการอนุมัติ",
          message: `ต้องการอนุมัติ "${dialogState.user.name}" (${dialogState.user.email}) ให้เข้าใช้งานระบบหรือไม่?`,
          confirmText: "อนุมัติ",
          icon: <CheckCircle className="w-5 h-5 text-green-500" />,
          confirmClass: "bg-green-600 hover:bg-green-700",
        }
      case "reject":
        return {
          title: "ยืนยันการปฏิเสธ",
          message: `ต้องการปฏิเสธและลบ "${dialogState.user.name}" (${dialogState.user.email}) ออกจากระบบหรือไม่?`,
          confirmText: "ปฏิเสธ",
          icon: <XCircle className="w-5 h-5 text-orange-500" />,
          confirmClass: "bg-orange-600 hover:bg-orange-700",
        }
      case "delete":
        return {
          title: "ยืนยันการลบผู้ใช้",
          message: `ต้องการลบ "${dialogState.user.name}" (${dialogState.user.email}) ออกจากระบบหรือไม่? ข้อมูลที่เกี่ยวข้องทั้งหมดจะถูกลบด้วย`,
          confirmText: "ลบ",
          icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
          confirmClass: "",
        }
      case "reset-password":
        return {
          title: "รีเซ็ตรหัสผ่าน",
          message: `ตั้งรหัสผ่านใหม่ให้ "${dialogState.user.name}" (${dialogState.user.email})`,
          confirmText: "รีเซ็ต",
          icon: <KeyRound className="w-5 h-5 text-blue-500" />,
          confirmClass: "bg-blue-600 hover:bg-blue-700",
        }
      default:
        return { title: "", message: "", confirmText: "", icon: null, confirmClass: "" }
    }
  }

  const dialogContent = getDialogContent()

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">จัดการผู้ใช้งาน</h1>

      <div className="grid gap-6">
        {/* Pending Users */}
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
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => openDialog("approve", user)}
                      >
                        อนุมัติ
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => openDialog("reject", user)}
                      >
                        ปฏิเสธ
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Approved Users */}
        <Card>
          <CardHeader>
            <CardTitle>ผู้ใช้งานที่อนุมัติแล้ว ({approvedUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {approvedUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge>{user.role}</Badge>
                    {user.id !== currentUserId && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs text-blue-600 border-blue-300 hover:bg-blue-50"
                          onClick={() => openDialog("reset-password", user)}
                        >
                          <KeyRound className="w-3.5 h-3.5 mr-1" />
                          รีเซ็ตรหัส
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="text-xs"
                          onClick={() => openDialog("delete", user)}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          ลบ
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={dialogState.open} onOpenChange={(open) => { if (!open) closeDialog() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {dialogContent.icon}
              {dialogContent.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">{dialogContent.message}</p>
            {dialogState.type === "delete" && (
              <p className="text-xs text-red-400">การลบนี้จะไม่สามารถกู้คืนได้</p>
            )}
            {dialogState.type === "reset-password" && (
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัว)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  autoFocus
                />
                {newPassword.length > 0 && newPassword.length < 6 && (
                  <p className="text-xs text-red-400">รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร</p>
                )}
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <DialogClose asChild>
                <Button variant="outline" disabled={loading}>ยกเลิก</Button>
              </DialogClose>
              <Button
                variant={dialogState.type === "approve" || dialogState.type === "reset-password" ? "default" : "destructive"}
                className={
                  dialogState.type === "approve" ? "bg-green-600 hover:bg-green-700"
                  : dialogState.type === "reject" ? "bg-orange-600 hover:bg-orange-700"
                  : dialogState.type === "reset-password" ? "bg-blue-600 hover:bg-blue-700"
                  : ""
                }
                onClick={handleConfirm}
                disabled={loading || (dialogState.type === "reset-password" && newPassword.length < 6)}
              >
                {loading ? "กำลังดำเนินการ..." : dialogContent.confirmText}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
