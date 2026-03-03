import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { ChevronLeft, ChevronRight, Clock, FolderKanban } from "lucide-react"

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

    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    // Build calendar days
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    const startOffset = firstDay.getDay() // 0=Sun
    const daysInMonth = lastDay.getDate()

    const calendarDays: (number | null)[] = []
    for (let i = 0; i < startOffset; i++) calendarDays.push(null)
    for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i)

    // Map events to days
    const dayEvents = new Map<number, { type: string; name: string; color: string }[]>()

    tasks.forEach(task => {
        if (task.dueDate) {
            const d = task.dueDate
            if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                const day = d.getDate()
                const events = dayEvents.get(day) || []
                events.push({ type: "task", name: task.name, color: "bg-blue-500" })
                dayEvents.set(day, events)
            }
        }
    })

    projects.forEach(proj => {
        if (proj.endDate) {
            const d = proj.endDate
            if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                const day = d.getDate()
                const events = dayEvents.get(day) || []
                events.push({ type: "project", name: `${proj.name} (deadline)`, color: "bg-red-500" })
                dayEvents.set(day, events)
            }
        }
        if (proj.startDate) {
            const d = proj.startDate
            if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                const day = d.getDate()
                const events = dayEvents.get(day) || []
                events.push({ type: "project", name: `${proj.name} (เริ่ม)`, color: "bg-green-500" })
                dayEvents.set(day, events)
            }
        }
    })

    const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"]
    const dayNames = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"]

    // Upcoming deadlines
    const upcomingTasks = tasks
        .filter(t => t.deadline && t.deadline >= now)
        .slice(0, 5)

    const upcomingProjects = projects
        .filter(p => p.endDate && p.endDate >= now)
        .slice(0, 5)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">ปฏิทิน</h1>
                <p className="text-gray-500 mt-1">ดูกำหนดส่งงานและเดดไลน์โปรเจค</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 sv-card-hover">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-900">
                            {monthNames[currentMonth]} {currentYear + 543}
                        </h2>
                    </div>

                    {/* Day headers */}
                    <div className="grid grid-cols-7 mb-2">
                        {dayNames.map(d => (
                            <div key={d} className="text-center text-xs font-medium text-gray-400 py-2">{d}</div>
                        ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day, idx) => {
                            const isToday = day === now.getDate()
                            const events = day ? dayEvents.get(day) || [] : []
                            return (
                                <div
                                    key={idx}
                                    className={`min-h-[80px] rounded-xl p-1.5 text-sm ${day ? "bg-gray-50/50 hover:bg-gray-50" : ""
                                        } ${isToday ? "ring-2 ring-purple-400 bg-purple-50/50" : ""}`}
                                >
                                    {day && (
                                        <>
                                            <span className={`inline-block w-6 h-6 text-center rounded-full text-xs leading-6 font-medium ${isToday ? "bg-purple-500 text-white" : "text-gray-700"
                                                }`}>
                                                {day}
                                            </span>
                                            <div className="mt-0.5 space-y-0.5">
                                                {events.slice(0, 2).map((ev, i) => (
                                                    <div key={i} className={`${ev.color} text-white text-[9px] px-1 py-0.5 rounded truncate`}>
                                                        {ev.name}
                                                    </div>
                                                ))}
                                                {events.length > 2 && (
                                                    <div className="text-[9px] text-gray-400">+{events.length - 2} อื่นๆ</div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Sidebar: Upcoming */}
                <div className="space-y-4">
                    {/* Upcoming Tasks */}
                    <div className="bg-white rounded-2xl p-5 sv-card-hover">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                            <Clock className="w-4 h-4 text-blue-500" /> งานที่กำลังจะถึง
                        </h3>
                        <div className="space-y-3">
                            {upcomingTasks.map(task => {
                                const days = task.dueDate ? Math.ceil((task.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0
                                return (
                                    <div key={task.id} className="flex items-start justify-between gap-2 py-2 border-b border-gray-50 last:border-0">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{task.name}</p>
                                            <p className="text-xs text-gray-400">{task.project.name}</p>
                                        </div>
                                        <span className={`text-xs font-medium flex-shrink-0 px-2 py-0.5 rounded-full ${days <= 3 ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600"
                                            }`}>
                                            {days} วัน
                                        </span>
                                    </div>
                                )
                            })}
                            {upcomingTasks.length === 0 && (
                                <p className="text-sm text-gray-400 text-center py-3">ไม่มีงานที่กำลังจะถึง</p>
                            )}
                        </div>
                    </div>

                    {/* Upcoming Project Deadlines */}
                    <div className="bg-white rounded-2xl p-5 sv-card-hover">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                            <FolderKanban className="w-4 h-4 text-purple-500" /> เดดไลน์โปรเจค
                        </h3>
                        <div className="space-y-3">
                            {upcomingProjects.map(proj => {
                                const days = proj.endDate ? Math.ceil((proj.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0
                                return (
                                    <div key={proj.id} className="flex items-start justify-between gap-2 py-2 border-b border-gray-50 last:border-0">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{proj.name}</p>
                                            <p className="text-xs text-gray-400">{proj.client.name}</p>
                                        </div>
                                        <span className={`text-xs font-medium flex-shrink-0 px-2 py-0.5 rounded-full ${days <= 7 ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-600"
                                            }`}>
                                            {days} วัน
                                        </span>
                                    </div>
                                )
                            })}
                            {upcomingProjects.length === 0 && (
                                <p className="text-sm text-gray-400 text-center py-3">ไม่มีเดดไลน์ใกล้ถึง</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
