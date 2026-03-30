"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Gift, Check, X, Clock, ChevronDown, ChevronUp, Wallet } from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────────────────

interface ClaimData {
  id: string
  period: string
  status: string
  note: string | null
  claimedAt: string
  reviewedAt: string | null
  reviewedBy: { name: string } | null
}

interface AssignmentData {
  id: string
  isActive: boolean
  reward: {
    name: string
    description: string | null
    amount: number
    frequency: string
  }
  claims: ClaimData[]
}

interface Props {
  assignments: AssignmentData[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const FREQ_LABELS: Record<string, string> = {
  MONTHLY: "รายเดือน",
  YEARLY: "รายปี",
  ONE_TIME: "ครั้งเดียว",
}

const FREQ_COLORS: Record<string, string> = {
  MONTHLY: "bg-blue-100 text-blue-700",
  YEARLY: "bg-green-100 text-green-700",
  ONE_TIME: "bg-orange-100 text-orange-700",
}

function formatAmount(n: number) {
  return n.toLocaleString("th-TH")
}

function getCurrentPeriod(frequency: string): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  if (frequency === "MONTHLY") return `${year}-${month}`
  if (frequency === "YEARLY") return `${year}`
  return "once"
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

export function MyRewardsClient({ assignments }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [expandedIds, setExpandedIds] = useState<string[]>([])

  function toggleExpand(id: string) {
    setExpandedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function handleClaim(assignmentId: string) {
    setLoading(true)
    try {
      await fetch("/api/rewards/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  // Summary calculations
  const totalRewards = assignments.length
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const claimedThisMonth = assignments.filter((a) =>
    a.claims.some((c) => c.claimedAt.startsWith(currentMonth) && c.status !== "REJECTED")
  ).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Gift className="w-6 h-6 text-purple-500" /> สวัสดิการของฉัน
        </h1>
        <p className="text-gray-500 mt-1">ดูและเคลมสวัสดิการของคุณ</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">จำนวนสวัสดิการ</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalRewards}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <Gift className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">เคลมแล้วเดือนนี้</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{claimedThisMonth}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Reward Cards */}
      {assignments.length === 0 && (
        <div className="text-center text-gray-400 py-16">ยังไม่มีสวัสดิการที่ได้รับ</div>
      )}

      <div className="space-y-4">
        {assignments.map((assignment) => {
          const currentPeriod = getCurrentPeriod(assignment.reward.frequency)
          const currentClaim = assignment.claims.find((c) => c.period === currentPeriod)
          const pastClaims = assignment.claims.filter((c) => c.period !== currentPeriod)
          const isExpanded = expandedIds.includes(assignment.id)

          return (
            <div key={assignment.id} className="bg-white rounded-2xl p-5 shadow-sm">
              {/* Reward info */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{assignment.reward.name}</h3>
                  <p className="text-xl font-bold text-purple-600 mt-1">฿{formatAmount(assignment.reward.amount)}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${FREQ_COLORS[assignment.reward.frequency] || ""}`}>
                  {FREQ_LABELS[assignment.reward.frequency] || assignment.reward.frequency}
                </span>
              </div>

              {assignment.reward.description && (
                <p className="text-sm text-gray-500 mb-4">{assignment.reward.description}</p>
              )}

              {/* Current period status */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                <div>
                  <p className="text-xs text-gray-500">งวดปัจจุบัน</p>
                  <p className="text-sm font-medium text-gray-700">
                    {formatPeriod(currentPeriod, assignment.reward.frequency)}
                  </p>
                </div>
                <div>
                  {!currentClaim && (
                    <button
                      onClick={() => handleClaim(assignment.id)}
                      disabled={loading}
                      className="sv-btn-purple text-sm disabled:opacity-50"
                    >
                      เคลม
                    </button>
                  )}
                  {currentClaim?.status === "PENDING" && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> รออนุมัติ
                    </span>
                  )}
                  {currentClaim?.status === "APPROVED" && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1">
                      <Check className="w-3 h-3" /> อนุมัติแล้ว
                    </span>
                  )}
                  {currentClaim?.status === "REJECTED" && (
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 flex items-center gap-1">
                        <X className="w-3 h-3" /> ถูกปฏิเสธ
                      </span>
                      <button
                        onClick={() => handleClaim(assignment.id)}
                        disabled={loading}
                        className="sv-btn-purple text-sm disabled:opacity-50"
                      >
                        เคลมอีกครั้ง
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Claim History */}
              {pastClaims.length > 0 && (
                <div className="mt-3">
                  <button
                    onClick={() => toggleExpand(assignment.id)}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    ประวัติการเคลม ({pastClaims.length})
                  </button>
                  {isExpanded && (
                    <div className="mt-2 space-y-2">
                      {pastClaims.map((claim) => (
                        <div key={claim.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 text-sm">
                          <div className="flex items-center gap-3">
                            <span className="text-gray-700 font-medium">
                              {formatPeriod(claim.period, assignment.reward.frequency)}
                            </span>
                            <span className="text-xs text-gray-400">{formatDate(claim.claimedAt)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {claim.status === "PENDING" && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">รออนุมัติ</span>
                            )}
                            {claim.status === "APPROVED" && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">อนุมัติ</span>
                            )}
                            {claim.status === "REJECTED" && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">ปฏิเสธ</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
