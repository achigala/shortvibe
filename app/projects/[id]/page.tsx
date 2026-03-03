import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import ProjectDetailClient from "@/components/project-detail-client"

export default async function ProjectDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const session = await auth()
    if (!session) redirect("/login")

    const { id } = await params

    const [project, users, taskStatuses] = await Promise.all([
        prisma.project.findUnique({
            where: { id },
            include: {
                client: true,
                owner: true,
                status: true,
                members: { include: { user: true } },
                tasks: {
                    include: {
                        assignees: { include: { user: true } },
                        status: true,
                        createdBy: true,
                        comments: {
                            include: { user: true },
                            orderBy: { createdAt: "asc" as const },
                        },
                        attachments: true,
                    },
                    orderBy: { createdAt: "asc" as const },
                },
            },
        }),
        prisma.user.findMany({ where: { isApproved: true }, orderBy: { name: "asc" } }),
        prisma.masterData.findMany({ where: { category: "TASK_STATUS" }, orderBy: { order: "asc" } }),
    ])

    if (!project) notFound()

    const isBoss = session.user.role === "BOSS"
    const isBossOrDev = isBoss || session.user.role === "DEVELOPER"
    const currentUserId = (session.user as any).id as string

    // Serialize dates (use 'as any' for user fields that include employee profile)
    const serialized = {
        ...project,
        startDate: project.startDate?.toISOString() || null,
        endDate: project.endDate?.toISOString() || null,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        client: { ...project.client, createdAt: project.client.createdAt.toISOString(), updatedAt: project.client.updatedAt.toISOString() },
        owner: { ...(project.owner as any), createdAt: project.owner.createdAt.toISOString(), updatedAt: project.owner.updatedAt.toISOString(), birthday: (project.owner as any).birthday?.toISOString() || null },
        status: { ...project.status, createdAt: project.status.createdAt.toISOString(), updatedAt: project.status.updatedAt.toISOString() },
        members: project.members.map(m => ({
            id: m.id, userId: m.userId, projectId: m.projectId,
            user: { id: m.user.id, name: m.user.name, nickname: (m.user as any).nickname, avatar: m.user.avatar, role: m.user.role, position: (m.user as any).position },
        })),
        tasks: project.tasks.map(t => ({
            ...t,
            dueDate: t.dueDate?.toISOString() || null,
            closedAt: t.closedAt?.toISOString() || null,
            createdAt: t.createdAt.toISOString(),
            updatedAt: t.updatedAt.toISOString(),
            status: t.status ? { id: t.status.id, name: t.status.name, order: t.status.order } : null,
            createdBy: t.createdBy ? { id: t.createdBy.id, name: t.createdBy.name, nickname: (t.createdBy as any).nickname, avatar: t.createdBy.avatar } : null,
            assignees: t.assignees.map(a => ({
                ...a,
                user: { ...(a.user as any), createdAt: a.user.createdAt.toISOString(), updatedAt: a.user.updatedAt.toISOString(), birthday: (a.user as any).birthday?.toISOString() || null },
            })),
            comments: t.comments.map(c => ({
                ...c,
                createdAt: c.createdAt.toISOString(),
                updatedAt: c.updatedAt.toISOString(),
                user: { ...(c.user as any), createdAt: c.user.createdAt.toISOString(), updatedAt: c.user.updatedAt.toISOString(), birthday: (c.user as any).birthday?.toISOString() || null },
            })),
            attachments: t.attachments.map(a => ({
                ...a,
                createdAt: a.createdAt.toISOString(),
            })),
        })),
    }

    const serializedUsers = users.map(u => ({
        ...(u as any),
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
        birthday: (u as any).birthday?.toISOString() || null,
    }))

    return (
        <ProjectDetailClient
            project={serialized}
            users={serializedUsers}
            taskStatuses={taskStatuses.map(s => ({ ...s, createdAt: s.createdAt.toISOString(), updatedAt: s.updatedAt.toISOString() }))}
            isBoss={isBoss}
            isBossOrDev={isBossOrDev}
            currentUserId={currentUserId}
        />
    )
}
