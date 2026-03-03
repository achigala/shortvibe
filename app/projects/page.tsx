import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { ProjectListClient } from "@/components/project-list-client"

export default async function ProjectsPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const isBossOrDev = session.user.role === "BOSS" || session.user.role === "DEVELOPER"

  const [projects, clients, users, statuses] = await Promise.all([
    prisma.project.findMany({
      include: {
        client: true,
        owner: true,
        status: true,
        members: { include: { user: true } },
        tasks: {
          include: {
            assignees: {
              include: { user: true }
            }
          }
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.client.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { isApproved: true }, orderBy: { name: "asc" } }),
    prisma.masterData.findMany({ where: { category: "PROJECT_STATUS" }, orderBy: { order: "asc" } }),
  ])

  // Serialize for client component
  const serializedProjects = projects.map(p => ({
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
  }))

  return (
    <ProjectListClient
      projects={serializedProjects}
      statuses={statuses.map(s => ({ id: s.id, name: s.name }))}
      users={users.map(u => ({ id: u.id, name: u.name }))}
      clients={clients.map(c => ({ value: c.id, label: c.name }))}
      userOptions={users.map(u => ({ value: u.id, label: u.name }))}
      statusOptions={statuses.map(s => ({ value: s.id, label: s.name }))}
      isBossOrDev={isBossOrDev}
    />
  )
}
