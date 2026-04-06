"use client"

import { useState } from "react"
import { Gift, Plus, Check, X, Clock, Users, Pencil, Trash2 } from "lucide-react"
import { SearchableSelect } from "@/components/ui/searchable-select"

const FREQ_OPTIONS = [
  { value: "MONTHLY", label: "รายเดือน" },
  { value: "YEARLY", label: "รายปี" },
  { value: "ONE_TIME", label: "ครั้งเดียว" },
]

// ─── Types ───────────────────────────────────────────────────────────────────

interface ClaimData {
  id: string
  period: string
  status: string
  note: string | null
  claimedAt: string
  reviewedAt: string | null
  reviewNote?: string | null
  claimedBy: { name: string; nickname?: string | null }
  reviewedBy: { name: string } | null
  assignment: {
    reward: { name: string; amount: number; frequency: string }
  }
}

interface AssignmentData {
  id: string
  userId: string
  isActive: boolean
  assignedAt: string
  user: { id: string; name: string; nickname?: string | null }
  claims: {
    id: string
    period: string
    status: string
    note: string | null
    claimedAt: string
    reviewedAt: string | null
    claimedBy: { name: string }
    reviewedBy: { name: string } | null
  }[]
}

interface RewardData {
  id: string
  name: string
  description: string | null
  amount: number
  frequency: string
  isActive: boolean
  createdAt: string
  createdBy: { name: string }
  assignments: AssignmentData[]
}

interface UserData {
  id: string
  name: string
  nickname?: string | null
}

interface Props {
  rewards: RewardData[]
  users: UserData[]
  pendingClaims: ClaimData[]
  allClaims: ClaimData[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const FREQ_LABELS: Record<string, string> = {
  MONTHLY: "รายเดือน",
  YEARLY: "รายปี",
  ONE_TIME: "ครั้งเดียว",
}

const FREQ_COLORS: Record<string, string> = {
  MONTHLY: "sv-badge sv-badge-inprogress",
  YEARLY: "sv-badge sv-badge-done",
  ONE_TIME: "sv-badge sv-badge-waiting",
}

function formatAmount(n: number) {
  return n.toLocaleString("th-TH")
}

function formatPeriod(period: string, frequency: string) {
  if (frequency === "ONE_TIME") return "ครั้งเดียว"
  if (frequency === "MONTHLY" && period.includes("-")) {
    const [y, m] = period.split("-")
    const thaiYear = parseInt(y) + 543
    const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."]
    return `${months[parseInt(m) - 1]} ${thaiYear}`
  }
  if (frequency === "YEARLY") {
    return `${parseInt(period) + 543}`
  }
  return period
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })
}

// ─── Component ───────────────────────────────────────────────────────────────

export function RewardsManagementClient({ rewards, users, pendingClaims, allClaims }: Props) {
  const [tab, setTab] = useState<"all" | "pending" | "history">("all")
  const [loading, setLoading] = useState(false)

  // Local state for optimistic updates
  const [localRewards, setLocalRewards] = useState(rewards)
  const [localPendingClaims, setLocalPendingClaims] = useState(pendingClaims)
  const [localAllClaims, setLocalAllClaims] = useState(allClaims)

  // Create reward dialog
  const [showCreate, setShowCreate] = useState(false)
  const [createName, setCreateName] = useState("")
  const [createDesc, setCreateDesc] = useState("")
  const [createAmount, setCreateAmount] = useState("")
  const [createFreq, setCreateFreq] = useState("MONTHLY")

  // Edit reward dialog
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editDesc, setEditDesc] = useState("")
  const [editAmount, setEditAmount] = useState("")
  const [editFreq, setEditFreq] = useState("MONTHLY")

  // Assign dialog
  const [assignRewardId, setAssignRewardId] = useState<string | null>(null)
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])

  // ─── Actions ─────────────────────────────────────────────────────────────

  async function handleCreate() {
    if (!createName.trim() || !createAmount) return
    setLoading(true)
    try {
      const res = await fetch("/api/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createName.trim(),
          description: createDesc.trim() || null,
          amount: parseFloat(createAmount),
          frequency: createFreq,
        }),
      })
      if (res.ok) {
        const newReward = await res.json()
        setLocalRewards(prev => [...prev, { ...newReward, assignments: newReward.assignments || [] }])
      }
      setShowCreate(false)
      setCreateName("")
      setCreateDesc("")
      setCreateAmount("")
      setCreateFreq("MONTHLY")
    } finally {
      setLoading(false)
    }
  }

  async function handleEdit() {
    if (!editId || !editName.trim() || !editAmount) return
    setLoading(true)
    try {
      const res = await fetch(`/api/rewards/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDesc.trim() || null,
          amount: parseFloat(editAmount),
          frequency: editFreq,
        }),
      })
      if (res.ok) {
        setLocalRewards(prev => prev.map(r => r.id === editId
          ? { ...r, name: editName.trim(), description: editDesc.trim() || null, amount: parseFloat(editAmount), frequency: editFreq }
          : r
        ))
        setEditId(null)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(rewardId: string) {
    if (!confirm("ต้องการลบสวัสดิการนี้?")) return
    setLoading(true)
    const prevRewards = localRewards
    try {
      const res = await fetch(`/api/rewards/${rewardId}`, { method: "DELETE" })
      if (res.ok) {
        setLocalRewards(prev => prev.filter(r => r.id !== rewardId))
      } else {
        setLocalRewards(prevRewards)
      }
    } catch {
      setLocalRewards(prevRewards)
    } finally {
      setLoading(false)
    }
  }

  function openAssignDialog(reward: RewardData) {
    setAssignRewardId(reward.id)
    setSelectedUserIds(reward.assignments.filter((a) => a.isActive).map((a) => a.userId))
  }

  async function handleAssign() {
    if (!assignRewardId) return
    const prevRewards = localRewards

    // Optimistic update — show immediately, rollback on failure
    setLocalRewards(prev => prev.map(r => {
      if (r.id !== assignRewardId) return r
      const newAssignments = selectedUserIds.map(uid => {
        const existing = r.assignments.find(a => a.userId === uid)
        if (existing) return { ...existing, isActive: true }
        const user = users.find(u => u.id === uid)!
        return {
          id: `temp-${uid}`,
          userId: uid,
          isActive: true,
          assignedAt: new Date().toISOString(),
          user,
          claims: [],
        }
      })
      return { ...r, assignments: newAssignments }
    }))
    setAssignRewardId(null)

    try {
      const res = await fetch(`/api/rewards/${assignRewardId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: selectedUserIds }),
      })
      if (!res.ok) setLocalRewards(prevRewards)
    } catch {
      setLocalRewards(prevRewards)
    }
  }

  function toggleUser(userId: string) {
    setSelectedUserIds((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  async function handleClaimAction(claimId: string, status: "APPROVED" | "REJECTED") {
    setLoading(true)
    const prevPending = localPendingClaims
    const prevAll = localAllClaims
    try {
      const res = await fetch(`/api/rewards/claims/${claimId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        const claim = prevPending.find(c => c.id === claimId)
        if (claim) {
          setLocalPendingClaims(prev => prev.filter(c => c.id !== claimId))
          setLocalAllClaims(prev => [...prev, { ...claim, status, reviewedAt: new Date().toISOString() }])
        }
      } else {
        setLocalPendingClaims(prevPending)
        setLocalAllClaims(prevAll)
      }
    } catch {
      setLocalPendingClaims(prevPending)
      setLocalAllClaims(prevAll)
    } finally {
      setLoading(false)
    }
  }

  function openEdit(reward: RewardData) {
    setEditId(reward.id)
    setEditName(reward.name)
    setEditDesc(reward.description || "")
    setEditAmount(String(reward.amount))
    setEditFreq(reward.frequency)
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  const tabs = [
    { key: "all" as const, label: "สวัสดิการทั้งหมด" },
    { key: "pending" as const, label: `รออนุมัติ (${localPendingClaims.length})` },
    { key: "history" as const, label: "ประวัติ" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="sv-icon-box sv-icon-purple">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h1 className="sv-section-title">สวัสดิการ</h1>
            <p className="text-gray-500 text-sm mt-0.5">จัดการสวัสดิการและอนุมัติการเคลม</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab 1: สวัสดิการทั้งหมด ── */}
      {tab === "all" && (
        <div className="space-y-4">
          <button onClick={() => setShowCreate(true)} className="sv-btn-purple flex items-center gap-2 px-4 py-2 text-sm">
            <Plus className="w-4 h-4" /> สร้างสวัสดิการ
          </button>

          {localRewards.length === 0 && (
            <div className="text-center text-gray-400 py-16">ยังไม่มีสวัสดิการ</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {localRewards.map((reward) => (
              <div key={reward.id} className="bg-white rounded-2xl p-5 sv-card-hover">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{reward.name}</h3>
                    <p className="text-xl font-bold text-purple-600 mt-1">฿{formatAmount(reward.amount)}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${FREQ_COLORS[reward.frequency] || ""}`}>
                    {FREQ_LABELS[reward.frequency] || reward.frequency}
                  </span>
                </div>

                {reward.description && <p className="text-sm text-gray-500 mb-3">{reward.description}</p>}

                {/* Assigned users */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex -space-x-1.5">
                    {reward.assignments
                      .filter((a) => a.isActive)
                      .slice(0, 5)
                      .map((a) => (
                        <div
                          key={a.id}
                          className="sv-avatar-sm border-2 border-white"
                          title={a.user.nickname || a.user.name}
                        >
                          {(a.user.nickname || a.user.name).charAt(0)}
                        </div>
                      ))}
                    {reward.assignments.filter((a) => a.isActive).length > 5 && (
                      <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-medium border-2 border-white">
                        +{reward.assignments.filter((a) => a.isActive).length - 5}
                      </div>
                    )}
                  </div>
                  {reward.assignments.filter((a) => a.isActive).length === 0 && (
                    <span className="text-xs text-gray-400">ยังไม่ได้มอบให้ใคร</span>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => openAssignDialog(reward)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <Users className="w-3.5 h-3.5" /> มอบให้พนักงาน
                  </button>
                  <button
                    onClick={() => openEdit(reward)}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                    title="แก้ไข"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(reward.id)}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="ลบ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab 2: รออนุมัติ ── */}
      {tab === "pending" && (
        <div className="space-y-3">
          {localPendingClaims.length === 0 && (
            <div className="text-center text-gray-400 py-16">ไม่มีรายการรออนุมัติ</div>
          )}
          {localPendingClaims.map((claim) => (
            <div key={claim.id} className="bg-white rounded-2xl p-5 sv-card-hover flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="sv-avatar">
                  {(claim.claimedBy.nickname || claim.claimedBy.name).charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{claim.claimedBy.nickname || claim.claimedBy.name}</p>
                  <p className="text-sm text-gray-500">
                    {claim.assignment.reward.name} — ฿{formatAmount(claim.assignment.reward.amount)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${FREQ_COLORS[claim.assignment.reward.frequency] || ""}`}>
                      {formatPeriod(claim.period, claim.assignment.reward.frequency)}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(claim.claimedAt)}</span>
                  </div>
                  {claim.note && <p className="text-xs text-gray-400 mt-1">หมายเหตุ: {claim.note}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleClaimAction(claim.id, "APPROVED")}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  <Check className="w-4 h-4" /> อนุมัติ
                </button>
                <button
                  onClick={() => handleClaimAction(claim.id, "REJECTED")}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" /> ปฏิเสธ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tab 3: ประวัติ ── */}
      {tab === "history" && (
        <div className="space-y-3">
          {localAllClaims.length === 0 && (
            <div className="text-center text-gray-400 py-16">ยังไม่มีประวัติการเคลม</div>
          )}
          {localAllClaims.map((claim) => (
            <div key={claim.id} className="bg-white rounded-2xl p-5 sv-card-hover flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="sv-avatar">
                  {(claim.claimedBy.nickname || claim.claimedBy.name).charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{claim.claimedBy.nickname || claim.claimedBy.name}</p>
                  <p className="text-sm text-gray-500">
                    {claim.assignment.reward.name} — ฿{formatAmount(claim.assignment.reward.amount)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${FREQ_COLORS[claim.assignment.reward.frequency] || ""}`}>
                      {formatPeriod(claim.period, claim.assignment.reward.frequency)}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(claim.claimedAt)}</span>
                  </div>
                  {claim.note && <p className="text-xs text-gray-400 mt-1">หมายเหตุ: {claim.note}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {claim.status === "APPROVED" ? (
                  <span className="sv-badge sv-badge-done">อนุมัติ</span>
                ) : (
                  <span className="sv-badge sv-badge-overdue">ปฏิเสธ</span>
                )}
                <div className="text-right">
                  {claim.reviewedAt && <p className="text-xs text-gray-400">{formatDate(claim.reviewedAt)}</p>}
                  {claim.reviewedBy && <p className="text-xs text-gray-400">โดย {claim.reviewedBy.name}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create Reward Dialog ── */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-4">สร้างสวัสดิการใหม่</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อสวัสดิการ *</label>
                <input
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="เช่น ค่าอาหาร, ค่าเดินทาง"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">คำอธิบาย</label>
                <textarea
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนเงิน (฿) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">฿</span>
                  <input
                    type="number"
                    value={createAmount}
                    onChange={(e) => setCreateAmount(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ความถี่</label>
                <SearchableSelect
                  options={FREQ_OPTIONS}
                  value={createFreq}
                  onChange={setCreateFreq}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleCreate}
                disabled={loading || !createName.trim() || !createAmount}
                className="sv-btn-purple px-4 py-2 text-sm disabled:opacity-50"
              >
                สร้าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Reward Dialog ── */}
      {editId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-4">แก้ไขสวัสดิการ</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อสวัสดิการ *</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">คำอธิบาย</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนเงิน (฿) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">฿</span>
                  <input
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    min="0"
                    className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ความถี่</label>
                <SearchableSelect
                  options={FREQ_OPTIONS}
                  value={editFreq}
                  onChange={setEditFreq}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setEditId(null)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleEdit}
                disabled={loading || !editName.trim() || !editAmount}
                className="sv-btn-purple px-4 py-2 text-sm disabled:opacity-50"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Assign Dialog ── */}
      {assignRewardId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-4">มอบสวัสดิการให้พนักงาน</h2>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {users.map((user) => (
                <label
                  key={user.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(user.id)}
                    onChange={() => toggleUser(user.id)}
                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-medium">
                    {(user.nickname || user.name).charAt(0)}
                  </div>
                  <span className="text-sm text-gray-700">{user.nickname || user.name}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setAssignRewardId(null)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button onClick={handleAssign} disabled={loading} className="sv-btn-purple px-4 py-2 text-sm disabled:opacity-50">
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
