import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import ClientsPageClient from "@/components/clients-page-client"

export default async function ClientsPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const isBossOrDev = session.user.role === "BOSS" || session.user.role === "DEVELOPER"

  const clients = await prisma.client.findMany({
    include: {
      projects: {
        include: {
          status: true,
          owner: true,
          revenues: true,
        },
        orderBy: { createdAt: "desc" },
      },
      revenues: true,
    },
    orderBy: { createdAt: "desc" },
  })

  const serialized = clients.map(c => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    projects: c.projects.map(p => {
      const projectRevenue = p.revenues.reduce((sum, r) => sum + r.amount, 0)
      return {
        id: p.id,
        name: p.name,
        isCompleted: p.isCompleted,
        startDate: p.startDate?.toISOString() || null,
        endDate: p.endDate?.toISOString() || null,
        status: p.status.name,
        owner: p.owner.name,
        amount: projectRevenue,
      }
    }),
    totalRevenue: c.revenues.reduce((sum, r) => sum + r.amount, 0),
  }))

  return <ClientsPageClient clients={serialized} isBossOrDev={isBossOrDev} />
}
