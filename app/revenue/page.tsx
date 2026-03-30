import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { Wallet } from "lucide-react"
import RevenueClient from "@/components/revenue-client"

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

  // Boss/Dev full view — revenue only (no clients needed for form anymore)
  const revenues = await prisma.revenue.findMany({
    include: { client: { select: { id: true, name: true } } },
    orderBy: { date: "desc" },
  })

  // Serialize dates for client component
  const serializedRevenues = revenues.map(r => ({
    ...r,
    date: r.date.toISOString(),
    createdAt: undefined,
    updatedAt: undefined,
  }))

  return (
    <RevenueClient revenues={serializedRevenues} />
  )
}
