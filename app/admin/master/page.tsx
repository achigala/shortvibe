import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { MasterDataClient } from "@/components/master-data-client"

export default async function MasterDataPage() {
  const session = await auth()
  if (!session || (session.user.role !== "BOSS" && session.user.role !== "DEVELOPER")) {
    redirect("/dashboard")
  }

  const masterData = await prisma.masterData.findMany({
    orderBy: [{ category: "asc" }, { order: "asc" }],
  })

  const groupedData = masterData.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, typeof masterData>)

  // Serialize data for client component
  const serializedData = Object.fromEntries(
    Object.entries(groupedData).map(([category, items]) => [
      category,
      items.map((item) => ({
        id: item.id,
        category: item.category,
        name: item.name,
        order: item.order,
        isActive: item.isActive,
      })),
    ])
  )

  return <MasterDataClient groupedData={serializedData} />
}
