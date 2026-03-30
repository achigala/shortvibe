"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Calendar, ExternalLink } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface SerializedTask {
    id: string
    name: string
    dueDate: string | null
    project: {
        id: string
        name: string
    }
    status: {
        name: string
    }
}

interface SerializedProject {
    id: string
    name: string
    startDate: string | null
    endDate: string | null
    client: {
        name: string
    }
    status: {
        name: string
    }
}

interface CalendarEvent {
    type: "task" | "project"
    name: string
    color: string
    projectId: string
    projectName: string
    clientName?: string
    statusName?: string
    eventKind: string // "task-due" | "project-start" | "project-deadline"
}

interface CalendarClientProps {
    tasks: SerializedTask[]
    projects: SerializedProject[]
}

const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"]
const dayNames = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"]

export function CalendarClient({ tasks, projects }: CalendarClientProps) {
    const now = new Date()
    const [currentMonth, setCurrentMonth] = useState(now.getMonth())
    const [currentYear, setCurrentYear] = useState(now.getFullYear())
    const [selectedDay, setSelectedDay] = useState<number | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)

    // Navigate months
    const goToPrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11)
            setCurrentYear(y => y - 1)
        } else {
            setCurrentMonth(m => m - 1)
        }
    }

    const goToNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0)
            setCurrentYear(y => y + 1)
        } else {
            setCurrentMonth(m => m + 1)
        }
    }

    const goToToday = () => {
        setCurrentMonth(now.getMonth())
        setCurrentYear(now.getFullYear())
    }

    // Build calendar grid
    const { calendarDays, dayEvents } = useMemo(() => {
        const firstDay = new Date(currentYear, currentMonth, 1)
        const lastDay = new Date(currentYear, currentMonth + 1, 0)
        const startOffset = firstDay.getDay()
        const daysInMonth = lastDay.getDate()

        const days: (number | null)[] = []
        for (let i = 0; i < startOffset; i++) days.push(null)
        for (let i = 1; i <= daysInMonth; i++) days.push(i)

        // Map events to days
        const events = new Map<number, CalendarEvent[]>()

        tasks.forEach(task => {
            if (task.dueDate) {
                const d = new Date(task.dueDate)
                if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                    const day = d.getDate()
                    const list = events.get(day) || []
                    list.push({
                        type: "task",
                        name: task.name,
                        color: "bg-blue-500",
                        projectId: task.project.id,
                        projectName: task.project.name,
                        statusName: task.status.name,
                        eventKind: "task-due",
                    })
                    events.set(day, list)
                }
            }
        })

        projects.forEach(proj => {
            if (proj.endDate) {
                const d = new Date(proj.endDate)
                if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                    const day = d.getDate()
                    const list = events.get(day) || []
                    list.push({
                        type: "project",
                        name: `${proj.name} (deadline)`,
                        color: "bg-red-500",
                        projectId: proj.id,
                        projectName: proj.name,
                        clientName: proj.client.name,
                        statusName: proj.status.name,
                        eventKind: "project-deadline",
                    })
                    events.set(day, list)
                }
            }
            if (proj.startDate) {
                const d = new Date(proj.startDate)
                if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                    const day = d.getDate()
                    const list = events.get(day) || []
                    list.push({
                        type: "project",
                        name: `${proj.name} (เริ่ม)`,
                        color: "bg-green-500",
                        projectId: proj.id,
                        projectName: proj.name,
                        clientName: proj.client.name,
                        statusName: proj.status.name,
                        eventKind: "project-start",
                    })
                    events.set(day, list)
                }
            }
        })

        return { calendarDays: days, dayEvents: events }
    }, [tasks, projects, currentMonth, currentYear])

    const selectedEvents = selectedDay ? dayEvents.get(selectedDay) || [] : []

    const handleDayClick = (day: number | null) => {
        if (!day) return
        const events = dayEvents.get(day)
        if (events && events.length > 0) {
            setSelectedDay(day)
            setDialogOpen(true)
        }
    }

    const isCurrentMonth = currentMonth === now.getMonth() && currentYear === now.getFullYear()

    return (
        <>
            <div className="bg-white rounded-2xl p-6 sv-card-hover">
                {/* Header with navigation */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-gray-900">
                            {monthNames[currentMonth]} {currentYear + 543}
                        </h2>
                        {!isCurrentMonth && (
                            <button
                                onClick={goToToday}
                                className="text-xs px-3 py-1 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition font-medium"
                            >
                                วันนี้
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={goToPrevMonth}
                            className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-600"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={goToNextMonth}
                            className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-600"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 mb-2">
                    {dayNames.map(d => (
                        <div key={d} className="text-center text-sm font-semibold text-gray-400 py-3">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, idx) => {
                        const isToday = isCurrentMonth && day === now.getDate()
                        const events = day ? dayEvents.get(day) || [] : []
                        const hasEvents = events.length > 0

                        return (
                            <div
                                key={idx}
                                onClick={() => handleDayClick(day)}
                                className={`min-h-[100px] rounded-xl p-2 text-sm transition-all
                                    ${day ? "bg-gray-50/50" : ""}
                                    ${day && hasEvents ? "hover:bg-purple-50 hover:shadow-sm cursor-pointer" : ""}
                                    ${day && !hasEvents ? "hover:bg-gray-50" : ""}
                                    ${isToday ? "ring-2 ring-purple-400 bg-purple-50/50" : ""}
                                `}
                            >
                                {day && (
                                    <>
                                        <span className={`inline-block w-7 h-7 text-center rounded-full text-sm leading-7 font-medium
                                            ${isToday ? "bg-purple-500 text-white" : "text-gray-700"}
                                        `}>
                                            {day}
                                        </span>
                                        <div className="mt-1 space-y-1">
                                            {events.slice(0, 3).map((ev, i) => (
                                                <div
                                                    key={i}
                                                    className={`${ev.color} text-white text-[10px] px-1.5 py-0.5 rounded-md truncate font-medium`}
                                                >
                                                    {ev.name}
                                                </div>
                                            ))}
                                            {events.length > 3 && (
                                                <div className="text-[10px] text-purple-500 font-medium">
                                                    +{events.length - 3} อื่นๆ
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span className="w-3 h-3 rounded-full bg-blue-500"></span> กำหนดส่งงาน
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span className="w-3 h-3 rounded-full bg-green-500"></span> เริ่มโปรเจค
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span className="w-3 h-3 rounded-full bg-red-500"></span> เดดไลน์โปรเจค
                    </div>
                </div>
            </div>

            {/* Event detail popup */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-purple-500" />
                            {selectedDay} {monthNames[currentMonth]} {currentYear + 543}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                        {selectedEvents.map((ev, i) => (
                            <div
                                key={i}
                                className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition"
                            >
                                <span className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${ev.color}`}></span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{ev.name}</p>
                                    {ev.type === "task" && (
                                        <p className="text-xs text-gray-500 mt-0.5">โปรเจค: {ev.projectName}</p>
                                    )}
                                    {ev.clientName && (
                                        <p className="text-xs text-gray-500 mt-0.5">ลูกค้า: {ev.clientName}</p>
                                    )}
                                    {ev.statusName && (
                                        <p className="text-xs text-gray-400 mt-0.5">สถานะ: {ev.statusName}</p>
                                    )}
                                    <Link
                                        href={`/projects/${ev.projectId}`}
                                        className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-medium mt-2"
                                    >
                                        ดูโปรเจค <ExternalLink className="w-3 h-3" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
