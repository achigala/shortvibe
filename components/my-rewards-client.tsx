"use client"

import { useState } from "react"
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
  MONTHLY: "sv-badge sv-badge-inprogress",
  YEARLY: "sv-badge sv-badge-done",
  ONE_TIME: "sv-badge sv-badge-waiting",
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
  const [loading, setLoading] = useState(false)
  const [expandedIds, setExpandedIds] = useState<string[]>([])
  const [localAssignments, setLocalAssignments] = useState(assignments)

  function toggleExpand(id: string) {
    setExpandedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function handleClaim(assignmentId: string) {
    setLoading(true)
    const prev = localAssignments
    try {
      const res = await fetch("/api/rewards/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId }),
      })
      if (res.ok) {
        // Wait for server confirmation (financial action) before updating UI
        const newClaim = await res.json()
        setLocalAssignments((curr) =>
          curr.map((a) =>
            a.id === assignmentId
              ? {
                  ...a,
                  claims: [
                    {
                      id: newClaim.id,
                      period: newClaim.period,
                      status: newClaim.status,
                      note: newClaim.note,
                      claimedAt: newClaim.claimedAt,
                      reviewedAt: null,
                      reviewedBy: null,
                    },
                    ...a.claims,
                  ],
                }
              : a
          )
        )
      } else {
        setLocalAssignments(prev)
      }
    } catch {
      setLocalAssignments(prev)
    } finally {
      setLoading(false)
    }
  }

  // Summary calculations
  const totalRewards = localAssignments.length
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const claimedThisMonth = localAssignments.filter((a) =>
    a.claims.some((c) => c.claimedAt.startsWith(currentMonth) && c.status !== "REJECTED")
  ).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="sv-icon-box sv-icon-purple">
          <Gift className="w-5 h-5" />
        </div>
        <div>
          <h1 className="sv-section-title">สวัสดิการของฉัน</h1>
          <p className="text-gray-500 text-sm mt-0.5">ดูและเคลมสวัสดิการของคุณ</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 sv-card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">จำนวนสวัสดิการ</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalRewards}</p>
            </div>
            <div className="sv-icon-box sv-icon-purple">
              <Gift className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 sv-card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">เคลมแล้วเดือนนี้</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{claimedThisMonth}</p>
            </div>
            <div className="sv-icon-box sv-icon-green">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Reward Cards */}
      {localAssignments.length === 0 && (
        <div className="text-center text-gray-400 py-16">ยังไม่มีสวัสดิการที่ได้รับ</div>
      )}

      <div className="space-y-4">
        {localAssignments.map((assignment) => {
          const currentPeriod = getCurrentPeriod(assignment.reward.frequency)
          const currentClaim = assignment.claims.find((c) => c.period === currentPeriod)
          const pastClaims = assignment.claims.filter((c) => c.period !== currentPeriod)
          const isExpanded = expandedIds.includes(assignment.id)

          return (
            <div key={assignment.id} className="bg-white rounded-2xl p-5 sv-card-hover">
              {/* Reward info */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{assignment.reward.name}</h3>
                  <p className="text-xl font-bold text-purple-600 mt-1">฿{formatAmount(assignment.reward.amount)}</p>
                </div>
                <span className={FREQ_COLORS[assignment.reward.frequency] || ""}>
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
                      className="sv-btn-purple px-4 py-2 text-sm disabled:opacity-50"
                    >
                      เคลม
                    </button>
                  )}
                  {currentClaim?.status === "PENDING" && (
                    <span className="sv-badge sv-badge-waiting flex items-center gap-1">
                      <Clock className="w-3 h-3" /> รออนุมัติ
                    </span>
                  )}
                  {currentClaim?.status === "APPROVED" && (
                    <span className="sv-badge sv-badge-done flex items-center gap-1">
                      <Check className="w-3 h-3" /> อนุมัติแล้ว
                    </span>
                  )}
                  {currentClaim?.status === "REJECTED" && (
                    <div className="flex items-center gap-2">
                      <span className="sv-badge sv-badge-overdue flex items-center gap-1">
                        <X className="w-3 h-3" /> ถูกปฏิเสธ
                      </span>
                      <button
                        onClick={() => handleClaim(assignment.id)}
                        disabled={loading}
                        className="sv-btn-purple px-4 py-2 text-sm disabled:opacity-50"
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
                              <span className="sv-badge sv-badge-waiting">รออนุมัติ</span>
                            )}
                            {claim.status === "APPROVED" && (
                              <span className="sv-badge sv-badge-done">อนุมัติ</span>
                            )}
                            {claim.status === "REJECTED" && (
                              <span className="sv-badge sv-badge-overdue">ปฏิเสธ</span>
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
