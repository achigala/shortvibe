"use client"

import { useState, useMemo } from "react"
import {
  Download, Wallet, Users, UserPlus,
  TrendingUp, Crown,
  Receipt, Briefcase, CalendarDays
} from "lucide-react"

interface RevenueItem {
  id: string
  clientId: string
  amount: number
  date: string // ISO string
  type: string
  description: string | null
  isConfirmed: boolean
  client: { id: string; name: string }
}

interface RevenueClientProps {
  revenues: RevenueItem[]
}

const MONTH_NAMES = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน",
  "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม",
  "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
]

const SHORT_MONTH_NAMES = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.",
  "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.",
  "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
]

const typeColors: Record<string, string> = {
  "Fastwork": "sv-badge sv-badge-inprogress",
  "Line": "sv-badge sv-badge-done",
  "Direct": "sv-badge sv-badge-review",
  "Referral": "sv-badge sv-badge-waiting",
}

export default function RevenueClient({ revenues }: RevenueClientProps) {
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth())
  const [showAll, setShowAll] = useState(false)

  // Get available years from data
  const availableYears = useMemo(() => {
    const years = new Set<number>()
    years.add(now.getFullYear())
    revenues.forEach(r => {
      years.add(new Date(r.date).getFullYear())
    })
    return Array.from(years).sort((a, b) => b - a)
  }, [revenues])

  // Filter revenues
  const filteredRevenues = useMemo(() => {
    if (showAll) return revenues
    return revenues.filter(r => {
      const d = new Date(r.date)
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth
    })
  }, [revenues, selectedYear, selectedMonth, showAll])

  // Analytics from filtered data
  const analytics = useMemo(() => {
    const totalRevenue = filteredRevenues.reduce((sum, r) => sum + r.amount, 0)

    // Client analysis
    const clientRevenueMap = new Map<string, { name: string; total: number; count: number }>()
    filteredRevenues.forEach(r => {
      const existing = clientRevenueMap.get(r.clientId)
      if (existing) {
        existing.total += r.amount
        existing.count += 1
      } else {
        clientRevenueMap.set(r.clientId, { name: r.client.name, total: r.amount, count: 1 })
      }
    })

    const topClients = Array.from(clientRevenueMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)

    const uniqueClients = clientRevenueMap.size
    const repeatClients = Array.from(clientRevenueMap.values()).filter(c => c.count > 1).length
    const newClients = uniqueClients - repeatClients
    const avgRevenuePerClient = uniqueClients > 0 ? Math.round(totalRevenue / uniqueClients) : 0

    // Revenue by type
    const typeMap = new Map<string, number>()
    filteredRevenues.forEach(r => {
      typeMap.set(r.type, (typeMap.get(r.type) || 0) + r.amount)
    })
    const revenueByType = Array.from(typeMap.entries())
      .map(([type, amount]) => ({ type, amount }))
      .sort((a, b) => b.amount - a.amount)

    return { totalRevenue, topClients, uniqueClients, repeatClients, newClients, avgRevenuePerClient, revenueByType }
  }, [filteredRevenues])

  const filterLabel = showAll
    ? "ทุกช่วงเวลา"
    : `${MONTH_NAMES[selectedMonth]} ${selectedYear + 543}`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">รายงานรายได้</h1>
          <p className="text-gray-500 mt-1">วิเคราะห์รายได้จากลูกค้าแต่ละราย</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 flex flex-wrap items-center gap-3 sv-card-hover">
        <CalendarDays className="w-5 h-5 text-purple-500" />
        <select
          value={selectedYear}
          onChange={(e) => { setSelectedYear(Number(e.target.value)); setShowAll(false) }}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-purple-300"
        >
          {availableYears.map(y => (
            <option key={y} value={y}>{y + 543}</option>
          ))}
        </select>
        <select
          value={selectedMonth}
          onChange={(e) => { setSelectedMonth(Number(e.target.value)); setShowAll(false) }}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-purple-300"
        >
          {MONTH_NAMES.map((name, i) => (
            <option key={i} value={i}>{name}</option>
          ))}
        </select>
        <button
          onClick={() => setShowAll(true)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            showAll
              ? "bg-purple-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          ทั้งหมด
        </button>
        <button
          onClick={() => {
            setSelectedYear(now.getFullYear())
            setSelectedMonth(now.getMonth())
            setShowAll(false)
          }}
          className="px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
        >
          เดือนนี้
        </button>

        <span className="ml-auto text-sm text-gray-400">
          กำลังแสดง: <span className="font-medium text-gray-700">{filterLabel}</span> ({filteredRevenues.length} รายการ)
        </span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="sv-highlight-purple">
          <p className="text-sm text-white/80 font-medium">รายได้รวม</p>
          <p className="text-3xl font-bold mt-2">฿{analytics.totalRevenue.toLocaleString()}</p>
          <p className="text-sm text-white/70 mt-2">{filteredRevenues.length} รายการ</p>
          <div className="absolute top-4 right-4 opacity-20">
            <Wallet className="w-12 h-12" />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 sv-card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">ลูกค้าใหม่</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{analytics.newClients}</p>
              <p className="text-xs text-gray-400 mt-1">ราย</p>
            </div>
            <div className="sv-icon-box sv-icon-blue"><UserPlus className="w-5 h-5" /></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 sv-card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">ลูกค้าเก่าจ้างซ้ำ</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{analytics.repeatClients}</p>
              <p className="text-xs text-gray-400 mt-1">ราย</p>
            </div>
            <div className="sv-icon-box sv-icon-green"><Users className="w-5 h-5" /></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 sv-card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">เฉลี่ยต่อลูกค้า</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">฿{analytics.avgRevenuePerClient.toLocaleString()}</p>
            </div>
            <div className="sv-icon-box sv-icon-purple"><TrendingUp className="w-5 h-5" /></div>
          </div>
        </div>
      </div>

      {/* Top Clients + Revenue by Channel */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Top Clients */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-6 sv-card-hover">
          <div className="flex items-center justify-between mb-5">
            <h2 className="sv-section-title">
              <Crown className="w-5 h-5 text-yellow-500" /> ลูกค้าที่ทำเงินสูงสุด
            </h2>
          </div>
          <div className="space-y-1">
            {analytics.topClients.map((client, index) => (
              <div key={client.name} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-700' :
                    index === 1 ? 'bg-gray-100 text-gray-600' :
                    index === 2 ? 'bg-orange-100 text-orange-600' :
                    'bg-gray-50 text-gray-400'
                  }`}>
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{client.name}</p>
                    <p className="text-xs text-gray-400">{client.count} โปรเจค</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">฿{client.total.toLocaleString()}</p>
                  {client.count > 1 && (
                    <span className="sv-badge sv-badge-done text-[10px]">จ้างซ้ำ</span>
                  )}
                </div>
              </div>
            ))}
            {analytics.topClients.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">ยังไม่มีข้อมูลรายได้ในช่วงเวลานี้</p>
            )}
          </div>
        </div>

        {/* Revenue by Channel */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 sv-card-hover">
          <h2 className="sv-section-title mb-5">
            <Briefcase className="w-5 h-5 text-purple-500" /> รายได้ตามช่องทาง
          </h2>
          <div className="space-y-4">
            {analytics.revenueByType.map(({ type, amount }) => {
              const percentage = analytics.totalRevenue > 0 ? Math.round((amount / analytics.totalRevenue) * 100) : 0
              return (
                <div key={type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={typeColors[type] || "sv-badge sv-badge-waiting"}>{type}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-700">฿{amount.toLocaleString()}</span>
                  </div>
                  <div className="sv-progress-bar">
                    <div className="sv-progress-fill" style={{ width: `${percentage}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 text-right">{percentage}%</p>
                </div>
              )
            })}
            {analytics.revenueByType.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">ยังไม่มีข้อมูล</p>
            )}
          </div>
        </div>
      </div>

      {/* Revenue Table */}
      <div className="bg-white rounded-2xl p-6 sv-card-hover">
        <div className="flex items-center justify-between mb-5">
          <h2 className="sv-section-title">
            <Receipt className="w-5 h-5 text-blue-500" /> รายการรายได้ทั้งหมด
          </h2>
          <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs text-gray-500 font-medium py-3 px-4">วันที่</th>
                <th className="text-left text-xs text-gray-500 font-medium py-3 px-4">ลูกค้า</th>
                <th className="text-left text-xs text-gray-500 font-medium py-3 px-4">ช่องทาง</th>
                <th className="text-left text-xs text-gray-500 font-medium py-3 px-4">รายละเอียด</th>
                <th className="text-right text-xs text-gray-500 font-medium py-3 px-4">จำนวนเงิน</th>
              </tr>
            </thead>
            <tbody>
              {filteredRevenues.map(r => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="text-sm text-gray-700 py-3 px-4">
                    {new Date(r.date).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="text-sm text-gray-900 font-medium py-3 px-4">{r.client.name}</td>
                  <td className="py-3 px-4">
                    <span className={typeColors[r.type] || "sv-badge sv-badge-waiting"}>{r.type}</span>
                  </td>
                  <td className="text-sm text-gray-500 py-3 px-4">{r.description || "-"}</td>
                  <td className="text-sm text-gray-900 font-semibold py-3 px-4 text-right">
                    ฿{r.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
              {filteredRevenues.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-gray-400 py-8">ไม่มีข้อมูลรายได้ในช่วงเวลานี้</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
