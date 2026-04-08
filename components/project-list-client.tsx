"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import {
    Search, FolderKanban, Clock, CheckCircle2,
    Hourglass, PackageCheck, TrendingUp, Calendar, X
} from "lucide-react"
import { CreateProjectDialog } from "@/components/create-project-dialog"
import type { SelectOption } from "@/components/ui/searchable-select"

interface ProjectData {
    id: string
    name: string
    isCompleted: boolean
    startDate: string | null
    endDate: string | null
    client: { name: string }
    owner: { name: string; nickname?: string }
    status: { id: string; name: string }
    members: { user: { name: string; nickname?: string } }[]
    tasks: { progress: number; assignees: { user: { id: string; name: string } }[] }[]
    budget: number | null
    totalReceived: number | null
}

interface ProjectListClientProps {
    projects: ProjectData[]
    statuses: { id: string; name: string }[]
    users: { id: string; name: string }[]
    clients: SelectOption[]
    userOptions: SelectOption[]
    statusOptions: SelectOption[]
    isBossOrDev: boolean
    currentUserId?: string
}

const getStatusBadge = (statusName: string) => {
    if (statusName.includes("รอ")) return "sv-badge sv-badge-waiting"
    if (statusName.includes("กำลัง")) return "sv-badge sv-badge-inprogress"
    if (statusName.includes("ตรวจ")) return "sv-badge sv-badge-review"
    if (statusName.includes("เสร็จ")) return "sv-badge sv-badge-done"
    return "sv-badge sv-badge-waiting"
}

const getDaysRemaining = (endDate: string | null) => {
    if (!endDate) return null
    return Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
}

export function ProjectListClient({
    projects,
    statuses,
    users,
    clients,
    userOptions,
    statusOptions,
    isBossOrDev,
    currentUserId,
}: ProjectListClientProps) {
    const searchParams = useSearchParams()
    const [search, setSearch] = useState("")
    const [filterStatus, setFilterStatus] = useState("")
    const [filterOwner, setFilterOwner] = useState("")
    const [filterMode, setFilterMode] = useState<string>("")
    const [filterDateFrom, setFilterDateFrom] = useState("")
    const [filterDateTo, setFilterDateTo] = useState("")

    // Read URL query params on mount
    useEffect(() => {
        const filter = searchParams.get("filter")
        const owner = searchParams.get("owner")
        const status = searchParams.get("status")
        const from = searchParams.get("from")
        const to = searchParams.get("to")

        if (filter === "me" && currentUserId) {
            setFilterOwner(currentUserId)
            setFilterMode("me")
        }
        if (filter === "active") {
            setFilterMode("active")
        }
        if (owner) {
            setFilterOwner(owner)
        }
        if (status) {
            setFilterStatus(status)
        }
        if (from) {
            setFilterDateFrom(from)
        }
        if (to) {
            setFilterDateTo(to)
        }
    }, [searchParams, currentUserId])

    const hasDateFilter = filterDateFrom || filterDateTo
    const clearDateFilter = () => {
        setFilterDateFrom("")
        setFilterDateTo("")
    }

    // Filter projects
    const filtered = projects.filter(p => {
        const matchSearch = !search ||
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.client.name.toLowerCase().includes(search.toLowerCase())
        const matchStatus = !filterStatus || p.status.id === filterStatus
        const matchOwner = !filterOwner || p.members.some(m => m.user.name === users.find(u => u.id === filterOwner)?.name) || p.owner.name === users.find(u => u.id === filterOwner)?.name

        // Additional filter modes from URL
        const matchMode = filterMode === "active" ? !p.isCompleted : true

        // Date range filter (based on startDate)
        let matchDate = true
        if (filterDateFrom && p.startDate) {
            matchDate = matchDate && new Date(p.startDate) >= new Date(filterDateFrom)
        }
        if (filterDateTo && p.startDate) {
            const toDate = new Date(filterDateTo)
            toDate.setHours(23, 59, 59, 999)
            matchDate = matchDate && new Date(p.startDate) <= toDate
        }
        // If project has no startDate and date filter is active, exclude it
        if ((filterDateFrom || filterDateTo) && !p.startDate) {
            matchDate = false
        }

        return matchSearch && matchStatus && matchOwner && matchMode && matchDate
    })

    const activeProjects = filtered.filter(p => !p.isCompleted)
    const completedProjects = filtered.filter(p => p.isCompleted)

    // Counts (from all projects, not filtered)
    const totalCount = projects.length
    const inProgressCount = projects.filter(p => p.status.name.includes("กำลัง")).length
    const doneCount = projects.filter(p => p.status.name.includes("เสร็จ")).length
    const waitingCount = projects.filter(p => p.status.name.includes("รอ")).length
    const closedCount = projects.filter(p => p.isCompleted).length

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">จัดการโปรเจค</h1>
                    <p className="text-gray-500 mt-1">ติดตามความคืบหน้าและมอบหมายงาน</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            placeholder="ค้นหาโปรเจค..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 w-[200px]"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    >
                        <option value="">ทุกสถานะ</option>
                        {statuses.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                    <select
                        value={filterOwner}
                        onChange={(e) => setFilterOwner(e.target.value)}
                        className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    >
                        <option value="">ทุกคน</option>
                        {users.map(u => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                    </select>
                    {/* Date Range Filter */}
                    <div className="flex items-center gap-1.5">
                        <div className="relative">
                            <Calendar className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input
                                type="date"
                                value={filterDateFrom}
                                onChange={(e) => setFilterDateFrom(e.target.value)}
                                className="pl-8 pr-2 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 w-[150px]"
                                title="ตั้งแต่วันที่"
                            />
                        </div>
                        <span className="text-xs text-gray-400">ถึง</span>
                        <div className="relative">
                            <Calendar className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input
                                type="date"
                                value={filterDateTo}
                                onChange={(e) => setFilterDateTo(e.target.value)}
                                className="pl-8 pr-2 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 w-[150px]"
                                title="ถึงวันที่"
                            />
                        </div>
                        {hasDateFilter && (
                            <button
                                onClick={clearDateFilter}
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                title="ล้าง filter วันที่"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    {isBossOrDev && (
                        <CreateProjectDialog
                            clients={clients}
                            users={userOptions}
                            statuses={statusOptions}
                        />
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-2xl p-5 sv-card-hover">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500">โปรเจคทั้งหมด</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{totalCount}</p>
                        </div>
                        <div className="sv-icon-box sv-icon-blue"><TrendingUp className="w-5 h-5" /></div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-5 sv-card-hover">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500">กำลังทำ</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{inProgressCount}</p>
                        </div>
                        <div className="sv-icon-box sv-icon-green"><Clock className="w-5 h-5" /></div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-5 sv-card-hover">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500">เสร็จสิ้น</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{doneCount}</p>
                        </div>
                        <div className="sv-icon-box sv-icon-green"><CheckCircle2 className="w-5 h-5" /></div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-5 sv-card-hover">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500">รอดำเนินการ</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{waitingCount}</p>
                        </div>
                        <div className="sv-icon-box sv-icon-orange"><Hourglass className="w-5 h-5" /></div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-5 sv-card-hover">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500">ปิดงานแล้ว</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{closedCount}</p>
                        </div>
                        <div className="sv-icon-box sv-icon-red"><PackageCheck className="w-5 h-5" /></div>
                    </div>
                </div>
            </div>

            {/* Section Title */}
            <div className="flex items-center gap-2">
                <h2 className="sv-section-title">
                    <TrendingUp className="w-5 h-5 text-blue-500" /> งานที่กำลังดำเนินการ
                </h2>
                <span className="text-sm bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full font-medium">
                    {activeProjects.length}
                </span>
            </div>

            {/* Project Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeProjects.map((project) => {
                    const progress = project.tasks.length > 0
                        ? Math.round(project.tasks.reduce((sum, t) => sum + t.progress, 0) / project.tasks.length)
                        : 0
                    const days = getDaysRemaining(project.endDate)
                    const isOverdue = days !== null && days < 0
                    const tasksDone = project.tasks.filter(t => t.progress >= 100).length
                    const totalTasks = project.tasks.length

                    return (
                        <Link key={project.id} href={`/projects/${project.id}`}>
                            <div className="bg-white rounded-2xl p-5 sv-card-hover cursor-pointer h-full">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className={getStatusBadge(project.status.name)}>
                                        {project.status.name}
                                    </span>
                                    {isOverdue && (
                                        <span className="sv-badge sv-badge-urgent">เลยกำหนด</span>
                                    )}
                                </div>
                                <h3 className="font-semibold text-gray-900 text-base mb-1">{project.name}</h3>
                                <p className="text-xs text-gray-400 flex items-center gap-1 mb-4">
                                    <FolderKanban className="w-3 h-3" /> {project.client.name}
                                </p>
                                <div className="mb-4">
                                    <div className="flex items-center justify-between text-sm mb-1.5">
                                        <span className="text-gray-500">ความคืบหน้า</span>
                                        <span className="font-medium text-gray-700">{progress}%</span>
                                    </div>
                                    <div className="sv-progress-bar">
                                        <div className="sv-progress-fill" style={{ width: `${progress}%` }} />
                                    </div>
                                </div>
                                {isBossOrDev && project.budget !== null && (
                                    <div className="mb-4 grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-gray-50">
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">มูลค่า</p>
                                            <p className="text-sm font-semibold text-purple-600">
                                                ฿{(project.budget || 0).toLocaleString("th-TH")}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">รับจริง</p>
                                            <p className="text-sm font-semibold text-green-600">
                                                ฿{(project.totalReceived || 0).toLocaleString("th-TH")}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {tasksDone}/{totalTasks} งาน
                                        </span>
                                        {days !== null && (
                                            <span className={`text-xs ${isOverdue ? "text-red-500 font-medium" : "text-gray-400"}`}>
                                                {isOverdue ? `เลย ${Math.abs(days)} วัน` : `เหลือ ${days} วัน`}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex -space-x-1.5">
                                        {project.members.slice(0, 4).map((m, idx) => (
                                            <div key={idx} className="sv-avatar-sm border-2 border-white" title={m.user.nickname || m.user.name}>
                                                {(m.user.nickname || m.user.name).charAt(0)}
                                            </div>
                                        ))}
                                        {project.members.length > 4 && (
                                            <div className="sv-avatar-sm border-2 border-white bg-gray-200 text-gray-500">+{project.members.length - 4}</div>
                                        )}
                                    </div>
                                </div>
                                {project.endDate && (
                                    <div className="mt-3 pt-3 border-t border-gray-50">
                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(project.endDate).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </Link>
                    )
                })}
                {activeProjects.length === 0 && (
                    <div className="col-span-full text-center text-gray-400 py-12">
                        ไม่พบโปรเจกต์ที่ตรงกับเงื่อนไข
                    </div>
                )}
            </div>

            {/* Completed Projects Table */}
            {completedProjects.length > 0 && (
                <div className="mt-8">
                    <div className="flex items-center gap-2 mb-4">
                        <h2 className="sv-section-title">
                            <PackageCheck className="w-5 h-5 text-green-500" /> โปรเจคที่ปิดงานแล้ว
                        </h2>
                        <span className="text-sm bg-green-100 text-green-600 px-2.5 py-0.5 rounded-full font-medium">
                            {completedProjects.length}
                        </span>
                    </div>
                    <div className="bg-white rounded-2xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-left">
                                    <th className="px-5 py-3 font-medium text-gray-500">โปรเจค</th>
                                    <th className="px-5 py-3 font-medium text-gray-500">ลูกค้า</th>
                                    <th className="px-5 py-3 font-medium text-gray-500">Owner</th>
                                    <th className="px-5 py-3 font-medium text-gray-500">วันเริ่ม</th>
                                    <th className="px-5 py-3 font-medium text-gray-500">วันสิ้นสุด</th>
                                    <th className="px-5 py-3 font-medium text-gray-500">สถานะ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {completedProjects.map(project => (
                                    <tr key={project.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-3">
                                            <Link href={`/projects/${project.id}`} className="font-medium text-gray-900 hover:text-purple-600 transition-colors">
                                                {project.name}
                                            </Link>
                                        </td>
                                        <td className="px-5 py-3 text-gray-500">{project.client.name}</td>
                                        <td className="px-5 py-3 text-gray-500">{project.owner.nickname || project.owner.name}</td>
                                        <td className="px-5 py-3 text-gray-400">
                                            {project.startDate ? new Date(project.startDate).toLocaleDateString("th-TH", { day: "numeric", month: "short" }) : "-"}
                                        </td>
                                        <td className="px-5 py-3 text-gray-400">
                                            {project.endDate ? new Date(project.endDate).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700">เสร็จสิ้น</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
