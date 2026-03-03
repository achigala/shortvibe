"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { SearchableSelect, type SelectOption } from "@/components/ui/searchable-select"

interface CreateProjectDialogProps {
  clients: SelectOption[]
  users: SelectOption[]
  statuses: SelectOption[]
}

export function CreateProjectDialog({ clients, users, statuses }: CreateProjectDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [clientId, setClientId] = useState("")
  const [ownerId, setOwnerId] = useState("")
  const [statusId, setStatusId] = useState("")

  function resetForm() {
    setClientId("")
    setOwnerId("")
    setStatusId("")
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!clientId || !ownerId || !statusId) return

    const formData = new FormData(e.currentTarget)
    setLoading(true)

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          description: formData.get("description"),
          clientId,
          ownerId,
          statusId,
          startDate: formData.get("startDate") || null,
          endDate: formData.get("endDate") || null,
        }),
      })

      if (res.ok) {
        setOpen(false)
        resetForm()
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
      <DialogTrigger asChild>
        <button className="sv-btn-purple flex items-center gap-2 px-5 py-2.5 text-sm">
          <Plus className="w-4 h-4" />
          สร้างโปรเจค
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>สร้างโปรเจกต์ใหม่</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">ชื่อโปรเจกต์ *</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">รายละเอียด</Label>
            <Input id="description" name="description" />
          </div>
          <div className="space-y-2">
            <Label>ลูกค้า *</Label>
            <SearchableSelect
              options={clients}
              value={clientId}
              onChange={setClientId}
              placeholder="เลือกลูกค้า"
              searchPlaceholder="ค้นหาลูกค้า..."
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Owner *</Label>
            <SearchableSelect
              options={users}
              value={ownerId}
              onChange={setOwnerId}
              placeholder="เลือก Owner"
              searchPlaceholder="ค้นหา Owner..."
              required
            />
          </div>
          <div className="space-y-2">
            <Label>สถานะ *</Label>
            <SearchableSelect
              options={statuses}
              value={statusId}
              onChange={setStatusId}
              placeholder="เลือกสถานะ"
              searchPlaceholder="ค้นหาสถานะ..."
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">วันเริ่ม</Label>
              <Input id="startDate" name="startDate" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">วันสิ้นสุด</Label>
              <Input id="endDate" name="endDate" type="date" />
            </div>
          </div>
          <button
            type="submit"
            className="w-full sv-btn-purple py-2.5"
            disabled={loading || !clientId || !ownerId || !statusId}
          >
            {loading ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
