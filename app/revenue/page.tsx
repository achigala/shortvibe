import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Plus, Download, Wallet, Users, UserPlus,
  TrendingUp, Crown, ArrowUpRight,
  Receipt, Briefcase
} from "lucide-react"

async function createRevenue(formData: FormData) {
  "use server"
  const session = await auth()
  if (!session || (session.user.role !== "BOSS" && session.user.role !== "DEVELOPER")) {
    return
  }

  const clientId = formData.get("clientId") as string
  const amount = parseFloat(formData.get("amount") as string)
  const date = formData.get("date") as string
  const type = formData.get("type") as string
  const description = formData.get("description") as string

  await prisma.revenue.create({
    data: {
      clientId,
      amount,
      date: new Date(date),
      type,
      description,
    }
  })

  revalidatePath("/revenue")
}

export default async function RevenuePage() {
  const session = await auth()
  if (!session) redirect("/login")

  const isBossOrDev = session.user.role === "BOSS" || session.user.role === "DEVELOPER"

  if (!isBossOrDev) {
    // Staff only sees monthly total
    const currentMonthRevenue = await prisma.revenue.aggregate({
      where: {
        date: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      _sum: { amount: true },
    })
    const monthlyTotal = currentMonthRevenue._sum.amount || 0

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">รายงานรายได้</h1>
        <div className="sv-highlight-green max-w-md mx-auto text-center">
          <p className="text-sm text-white/80 font-medium">รายได้เดือนนี้</p>
          <p className="text-4xl font-bold mt-2">฿{monthlyTotal.toLocaleString()}</p>
          <div className="absolute top-4 right-4 opacity-20">
            <Wallet className="w-12 h-12" />
          </div>
        </div>
      </div>
    )
  }

  // Boss/Dev full view
  const [clients, revenues] = await Promise.all([
    prisma.client.findMany({ orderBy: { name: "asc" } }),
    prisma.revenue.findMany({
      include: { client: true },
      orderBy: { date: "desc" },
    }),
  ])

  const totalRevenue = revenues.reduce((sum, r) => sum + r.amount, 0)
  const currentMonthRevenues = revenues.filter(r => {
    const now = new Date()
    return r.date.getMonth() === now.getMonth() && r.date.getFullYear() === now.getFullYear()
  })
  const monthlyTotal = currentMonthRevenues.reduce((sum, r) => sum + r.amount, 0)

  // Client revenue analysis
  const clientRevenueMap = new Map<string, { name: string; total: number; count: number }>()
  revenues.forEach(r => {
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

  // Unique clients and repeat clients
  const uniqueClients = clientRevenueMap.size
  const repeatClients = Array.from(clientRevenueMap.values()).filter(c => c.count > 1).length
  const newClients = uniqueClients - repeatClients
  const avgRevenuePerClient = uniqueClients > 0 ? Math.round(totalRevenue / uniqueClients) : 0

  // Revenue by type
  const typeMap = new Map<string, number>()
  revenues.forEach(r => {
    typeMap.set(r.type, (typeMap.get(r.type) || 0) + r.amount)
  })
  const revenueByType = Array.from(typeMap.entries())
    .map(([type, amount]) => ({ type, amount }))
    .sort((a, b) => b.amount - a.amount)

  const typeColors: Record<string, string> = {
    "Fastwork": "sv-badge sv-badge-inprogress",
    "Line": "sv-badge sv-badge-done",
    "Direct": "sv-badge sv-badge-review",
    "Referral": "sv-badge sv-badge-waiting",
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">รายงานรายได้</h1>
          <p className="text-gray-500 mt-1">วิเคราะห์รายได้จากลูกค้าแต่ละราย</p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <button className="sv-btn-purple flex items-center gap-2 px-5 py-2.5 text-sm">
                <Plus className="w-4 h-4" />
                เพิ่มรายได้
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>เพิ่มรายได้ใหม่</DialogTitle>
              </DialogHeader>
              <form action={createRevenue} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clientId">ลูกค้า *</Label>
                  <select id="clientId" name="clientId" required className="w-full p-2 border rounded-xl text-sm">
                    <option value="">เลือกลูกค้า</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">จำนวนเงิน (บาท) *</Label>
                  <Input id="amount" name="amount" type="number" step="0.01" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">วันที่รับเงิน *</Label>
                  <Input id="date" name="date" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">ช่องทาง *</Label>
                  <select id="type" name="type" required className="w-full p-2 border rounded-xl text-sm">
                    <option value="">เลือกช่องทาง</option>
                    <option value="Fastwork">Fastwork</option>
                    <option value="Line">Line</option>
                    <option value="Direct">Direct</option>
                    <option value="Referral">Referral</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">รายละเอียด</Label>
                  <Input id="description" name="description" />
                </div>
                <button type="submit" className="w-full sv-btn-purple py-2.5">บันทึก</button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="sv-highlight-purple">
          <p className="text-sm text-white/80 font-medium">รายได้รวม</p>
          <p className="text-3xl font-bold mt-2">฿{totalRevenue.toLocaleString()}</p>
          <p className="text-sm text-white/70 mt-2">{revenues.length} รายการ</p>
          <div className="absolute top-4 right-4 opacity-20">
            <Wallet className="w-12 h-12" />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 sv-card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">ลูกค้าใหม่</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{newClients}</p>
              <p className="text-xs text-gray-400 mt-1">ราย</p>
            </div>
            <div className="sv-icon-box sv-icon-blue"><UserPlus className="w-5 h-5" /></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 sv-card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">ลูกค้าเก่าจ้างซ้ำ</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{repeatClients}</p>
              <p className="text-xs text-gray-400 mt-1">ราย</p>
            </div>
            <div className="sv-icon-box sv-icon-green"><Users className="w-5 h-5" /></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 sv-card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">เฉลี่ยต่อลูกค้า</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">฿{avgRevenuePerClient.toLocaleString()}</p>
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
            {topClients.map((client, index) => (
              <div key={client.name} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
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
            {topClients.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">ยังไม่มีข้อมูลรายได้</p>
            )}
          </div>
        </div>

        {/* Revenue by Channel */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 sv-card-hover">
          <h2 className="sv-section-title mb-5">
            <Briefcase className="w-5 h-5 text-purple-500" /> รายได้ตามช่องทาง
          </h2>
          <div className="space-y-4">
            {revenueByType.map(({ type, amount }) => {
              const percentage = totalRevenue > 0 ? Math.round((amount / totalRevenue) * 100) : 0
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
            {revenueByType.length === 0 && (
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
              {revenues.map(r => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="text-sm text-gray-700 py-3 px-4">
                    {r.date.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
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
              {revenues.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-gray-400 py-8">ยังไม่มีข้อมูลรายได้</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
