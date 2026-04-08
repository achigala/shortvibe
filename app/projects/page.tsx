import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { ProjectListClient } from "@/components/project-list-client"
import { serverCache, CacheKeys, CacheTTL } from "@/lib/cache"

// Enable ISR - revalidate every 30 seconds
export const revalidate = 30

export default async function ProjectsPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const isBossOrDev = session.user.role === "BOSS" || session.user.role === "DEVELOPER"

  // Cache project list and related data
  const [projectData, clients, users, statuses] = await Promise.all([
    serverCache.getOrSet(
      CacheKeys.projectList(),
      async () => {
        const projects = await prisma.project.findMany({
          include: {
            client: { select: { name: true } },
            owner: { select: { name: true, nickname: true } },
            status: { select: { id: true, name: true } },
            members: { include: { user: { select: { name: true, nickname: true } } } },
            tasks: {
              select: {
                progress: true,
                assignees: {
                  select: { user: { select: { id: true, name: true } } }
                }
              }
            },
            revenues: { select: { amount: true } },
          },
          orderBy: { createdAt: "desc" },
        })

        return projects.map(p => ({
          id: p.id,
          name: p.name,
          isCompleted: p.isCompleted,
          startDate: p.startDate?.toISOString() || null,
          endDate: p.endDate?.toISOString() || null,
          client: { name: p.client.name },
          owner: { name: p.owner.name, nickname: (p.owner as any).nickname || undefined },
          status: { id: p.statusId, name: p.status.name },
          members: p.members.map(m => ({
            user: { name: m.user.name, nickname: (m.user as any).nickname || undefined }
          })),
          tasks: p.tasks.map(t => ({
            progress: t.progress,
            assignees: t.assignees.map(a => ({ user: { id: a.user.id, name: a.user.name } })),
          })),
          budget: p.budget,
          totalReceived: p.revenues.reduce((sum, r) => sum + r.amount, 0),
        }))
      },
      CacheTTL.SHORT
    ),
    serverCache.getOrSet(
      CacheKeys.clientList(),
      () => prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
      CacheTTL.LONG
    ),
    serverCache.getOrSet(
      CacheKeys.teamList(),
      () => prisma.user.findMany({ where: { isApproved: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
      CacheTTL.LONG
    ),
    serverCache.getOrSet(
      CacheKeys.masterData("PROJECT_STATUS"),
      () => prisma.masterData.findMany({ where: { category: "PROJECT_STATUS" }, orderBy: { order: "asc" }, select: { id: true, name: true } }),
      CacheTTL.VERY_LONG
    ),
  ])

  // Privacy: strip financial fields before sending to client when user is not Boss/Dev
  const safeProjectData = isBossOrDev
    ? projectData
    : projectData.map(p => ({ ...p, budget: null, totalReceived: null }))

  return (
    <ProjectListClient
      projects={safeProjectData}
      statuses={statuses.map(s => ({ id: s.id, name: s.name }))}
      users={users.map(u => ({ id: u.id, name: u.name }))}
      clients={clients.map(c => ({ value: c.id, label: c.name }))}
      userOptions={users.map(u => ({ value: u.id, label: u.name }))}
      statusOptions={statuses.map(s => ({ value: s.id, label: s.name }))}
      isBossOrDev={isBossOrDev}
      currentUserId={session.user.id}
    />
  )
}
