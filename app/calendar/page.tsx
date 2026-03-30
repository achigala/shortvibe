import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { CalendarClient } from "@/components/calendar-client"

export default async function CalendarPage() {
    const session = await auth()
    if (!session) redirect("/login")

    const isBossOrDev = session.user.role === "BOSS" || session.user.role === "DEVELOPER"
    const userId = (session.user as any).id as string | undefined

    // Build where clause safely
    const taskWhere = isBossOrDev || !userId ? {} : {
        assignees: { some: { userId } }
    }
    const projectWhere = isBossOrDev || !userId ? {} : {
        tasks: { some: { assignees: { some: { userId } } } }
    }

    let tasks: any[] = []
    let projects: any[] = []

    try {
        tasks = await prisma.task.findMany({
            where: taskWhere,
            include: {
                project: true,
                status: true,
            },
            orderBy: { dueDate: "asc" },
        })
    } catch (e) {
        console.error("Failed to fetch tasks:", e)
    }

    try {
        projects = await prisma.project.findMany({
            where: projectWhere,
            include: { client: true, status: true },
            orderBy: { endDate: "asc" },
        })
    } catch (e) {
        console.error("Failed to fetch projects:", e)
    }

    // Serialize for client component
    const serializedTasks = tasks.map(t => ({
        id: t.id,
        name: t.name,
        dueDate: t.dueDate?.toISOString() || null,
        project: { id: t.project.id, name: t.project.name },
        status: { name: t.status.name },
    }))

    const serializedProjects = projects.map(p => ({
        id: p.id,
        name: p.name,
        startDate: p.startDate?.toISOString() || null,
        endDate: p.endDate?.toISOString() || null,
        client: { name: p.client.name },
        status: { name: p.status.name },
    }))

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">ปฏิทิน</h1>
                <p className="text-gray-500 mt-1">ดูกำหนดส่งงานและเดดไลน์โปรเจค</p>
            </div>

            {/* Full-width calendar */}
            <CalendarClient tasks={serializedTasks} projects={serializedProjects} />
        </div>
    )
}
