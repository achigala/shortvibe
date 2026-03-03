"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Pencil, Trash2, Check, X, AlertTriangle } from "lucide-react"

interface MasterDataItem {
  id: string
  category: string
  name: string
  order: number
  isActive: boolean
}

interface MasterDataClientProps {
  groupedData: Record<string, MasterDataItem[]>
}

const categoryLabels: Record<string, string> = {
  PROJECT_STATUS: "สถานะโปรเจกต์",
  TASK_STATUS: "สถานะงาน",
}

export function MasterDataClient({ groupedData }: MasterDataClientProps) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<MasterDataItem | null>(null)
  const [addOpen, setAddOpen] = useState<string | null>(null)
  const [addName, setAddName] = useState("")
  const [loading, setLoading] = useState(false)

  // --- ADD ---
  async function handleAdd(category: string) {
    if (!addName.trim()) return
    setLoading(true)
    try {
      await fetch("/api/master", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, name: addName.trim() }),
      })
      setAddName("")
      setAddOpen(null)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  // --- EDIT ---
  function startEdit(item: MasterDataItem) {
    setEditingId(item.id)
    setEditValue(item.name)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditValue("")
  }

  async function saveEdit(id: string) {
    if (!editValue.trim()) return
    setLoading(true)
    try {
      await fetch("/api/master", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: editValue.trim() }),
      })
      setEditingId(null)
      setEditValue("")
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  // --- DELETE ---
  async function confirmDelete() {
    if (!deleteTarget) return
    setLoading(true)
    try {
      await fetch(`/api/master?id=${deleteTarget.id}`, {
        method: "DELETE",
      })
      setDeleteTarget(null)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Master Data</h1>
          <p className="text-gray-500">จัดการข้อมูลหลัก</p>
        </div>
      </div>

      {Object.entries(groupedData).map(([category, items]) => (
        <Card key={category}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>{categoryLabels[category] || category}</CardTitle>
              <Dialog open={addOpen === category} onOpenChange={(open) => { setAddOpen(open ? category : null); if (!open) setAddName("") }}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    เพิ่ม
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>เพิ่ม{categoryLabels[category] || category}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>ชื่อ *</Label>
                      <Input
                        value={addName}
                        onChange={(e) => setAddName(e.target.value)}
                        placeholder="กรอกชื่อ..."
                        onKeyDown={(e) => { if (e.key === "Enter") handleAdd(category) }}
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => handleAdd(category)}
                      disabled={loading || !addName.trim()}
                    >
                      {loading ? "กำลังบันทึก..." : "บันทึก"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ลำดับ</TableHead>
                  <TableHead>ชื่อ</TableHead>
                  <TableHead className="w-[100px]">สถานะ</TableHead>
                  <TableHead className="w-[120px] text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.order}</TableCell>
                    <TableCell className="font-medium">
                      {editingId === item.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="h-8"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEdit(item.id)
                              if (e.key === "Escape") cancelEdit()
                            }}
                            autoFocus
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => saveEdit(item.id)}
                            disabled={loading}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                            onClick={cancelEdit}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        item.name
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.isActive ? "default" : "secondary"}>
                        {item.isActive ? "ใช้งาน" : "ไม่ใช้งาน"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {editingId !== item.id && (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => startEdit(item)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setDeleteTarget(item)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              ยืนยันการลบ
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              คุณต้องการลบ <span className="font-semibold text-gray-900">&quot;{deleteTarget?.name}&quot;</span> หรือไม่?
            </p>
            <p className="text-xs text-gray-400">การลบนี้จะไม่สามารถกู้คืนได้</p>
            <div className="flex gap-3 justify-end">
              <DialogClose asChild>
                <Button variant="outline">ยกเลิก</Button>
              </DialogClose>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={loading}
              >
                {loading ? "กำลังลบ..." : "ลบ"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
