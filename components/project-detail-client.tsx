"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
    ArrowLeft, Calendar, User, Building2, Clock,
    Plus, ChevronDown, ChevronUp, Send, Link2,
    MessageCircle, CheckCircle2, Trash2, Users,
    FolderKanban, AlertCircle, UserPlus, Pencil,
    Wallet, Receipt, X
} from "lucide-react"

type MemberUser = {
    id: string; name: string; nickname: string | null;
    avatar: string | null; role: string; position: string | null;
}

type ProjectMember = {
    id: string; userId: string; projectId: string;
    user: MemberUser;
}

type SerializedUser = {
    id: string; name: string; email: string; role: string;
    nickname: string | null; position: string | null;
    avatar: string | null;
    [key: string]: any
}

type TaskComment = {
    id: string; content: string; createdAt: string;
    user: SerializedUser
}

type TaskAttachment = {
    id: string; type: string; url: string; name: string | null; createdAt: string;
}

type TaskAssignee = {
    id: string; userId: string; user: SerializedUser;
}

type TaskStatus = {
    id: string; name: string; order: number;
}

type Task = {
    id: string; name: string; description: string | null;
    progress: number; statusId: string | null;
    dueDate: string | null;
    isClosed: boolean; closedAt: string | null;
    createdAt: string; updatedAt: string;
    status: TaskStatus | null;
    createdBy: { id: string; name: string; nickname: string | null; avatar: string | null } | null;
    assignees: TaskAssignee[];
    comments: TaskComment[];
    attachments: TaskAttachment[];
    category: { id: string; name: string; order: number } | null;
}

type Project = {
    id: string; name: string; description: string | null;
    clientId: string; ownerId: string; statusId: string;
    isCompleted: boolean;
    startDate: string | null; endDate: string | null;
    budget: number | null;
    createdAt: string; updatedAt: string;
    client: { id: string; name: string; businessType: string | null;[key: string]: any };
    owner: SerializedUser;
    status: { id: string; name: string;[key: string]: any };
    members: ProjectMember[];
    tasks: Task[];
}

type ProjectStatus = {
    id: string; name: string;
}

type RevenueEntry = {
    id: string
    amount: number
    date: string
    type: string
    description: string | null
}

type Props = {
    project: Project
    users: SerializedUser[]
    taskStatuses: any[]
    projectStatuses: ProjectStatus[]
    isBoss: boolean
    isBossOrDev: boolean
    currentUserId: string
    revenues?: RevenueEntry[]
    taskCategories: { id: string; name: string; order: number; [key: string]: any }[]
}

// Avatar color palette
const avatarColors = [
    "from-purple-400 to-pink-400",
    "from-blue-400 to-cyan-400",
    "from-green-400 to-emerald-400",
    "from-orange-400 to-yellow-400",
    "from-rose-400 to-red-400",
    "from-indigo-400 to-violet-400",
    "from-teal-400 to-green-400",
    "from-fuchsia-400 to-pink-400",
]

function getAvatarColor(userId: string) {
    let hash = 0
    for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash)
    return avatarColors[Math.abs(hash) % avatarColors.length]
}

function Avatar({ user, size = "md" }: { user: { id: string; name: string; nickname?: string | null; avatar?: string | null }; size?: "sm" | "md" | "lg" }) {
    const sizeClass = size === "sm" ? "w-7 h-7 text-xs" : size === "lg" ? "w-12 h-12 text-lg" : "w-9 h-9 text-sm"
    const initial = (user.nickname || user.name).charAt(0).toUpperCase()
    const gradient = getAvatarColor(user.id)

    if (user.avatar) {
        return <img src={user.avatar} alt={user.name} className={`${sizeClass} rounded-full object-cover border-2 border-white shadow-sm`} />
    }

    return (
        <div className={`${sizeClass} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold border-2 border-white shadow-sm`} title={user.nickname || user.name}>
            {initial}
        </div>
    )
}

export default function ProjectDetailClient({ project, users, taskStatuses, projectStatuses, isBoss, isBossOrDev, currentUserId, revenues: initialRevenues = [], taskCategories }: Props) {
    const router = useRouter()
    const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
    const [showAddTask, setShowAddTask] = useState(false)
    const [showMemberPanel, setShowMemberPanel] = useState(false)

    // Revenue state
    const [revenues, setRevenues] = useState<RevenueEntry[]>(initialRevenues)
    const [showAddRevenue, setShowAddRevenue] = useState(false)
    const [revenueAmount, setRevenueAmount] = useState("")
    const [revenueDate, setRevenueDate] = useState(new Date().toISOString().split("T")[0])
    const [revenueType, setRevenueType] = useState("รายได้โปรเจค")
    const [revenueDesc, setRevenueDesc] = useState("")
    const [revenueSaving, setRevenueSaving] = useState(false)

    // New task form
    const [newTaskName, setNewTaskName] = useState("")
    const [newTaskDesc, setNewTaskDesc] = useState("")
    const [newTaskDue, setNewTaskDue] = useState("")
    const [newTaskAssignees, setNewTaskAssignees] = useState<string[]>([])
    const [newTaskCategory, setNewTaskCategory] = useState("")
    const [categorySearch, setCategorySearch] = useState("")
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)

    // Edit task form
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
    const [editName, setEditName] = useState("")
    const [editDesc, setEditDesc] = useState("")
    const [editDue, setEditDue] = useState("")

    // Comment form
    const [commentTexts, setCommentTexts] = useState<Record<string, string>>({})

    // Link form
    const [linkUrls, setLinkUrls] = useState<Record<string, string>>({})

    const [saving, setSaving] = useState(false)

    // Edit project form
    const [showEditProject, setShowEditProject] = useState(false)
    const [editProjectName, setEditProjectName] = useState(project.name)
    const [editProjectDesc, setEditProjectDesc] = useState(project.description || "")
    const [editProjectStatusId, setEditProjectStatusId] = useState(project.statusId)
    const [editProjectOwnerId, setEditProjectOwnerId] = useState(project.ownerId)
    const [editProjectStartDate, setEditProjectStartDate] = useState(project.startDate ? project.startDate.split("T")[0] : "")
    const [editProjectEndDate, setEditProjectEndDate] = useState(project.endDate ? project.endDate.split("T")[0] : "")

    // Local project state (optimistic updates)
    const [localProject, setLocalProject] = useState(project)

    // Local tasks state (optimistic updates)
    const [localTasks, setLocalTasks] = useState(project.tasks)

    // Member state (optimistic updates)
    const [localMemberIds, setLocalMemberIds] = useState<string[]>(project.members.map(m => m.userId))

    // Sync from server props when they change
    useEffect(() => {
        setLocalMemberIds(project.members.map(m => m.userId))
    }, [project.members])

    // Derive displayed members from users list + local state
    const currentMembers = localMemberIds
        .map(id => users.find(u => u.id === id))
        .filter(Boolean) as SerializedUser[]

    // Computed
    const totalTasks = localTasks.length
    const doneTasks = localTasks.filter(t => t.status?.name?.includes("เสร็จ")).length
    const overallProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
    const canComplete = isBoss && doneTasks === totalTasks && totalTasks > 0 && !project.isCompleted

    // === HANDLERS ===
    const handleCreateTask = async () => {
        if (!newTaskName.trim()) return
        setSaving(true)
        try {
            const res = await fetch(`/api/projects/${project.id}/tasks`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newTaskName,
                    description: newTaskDesc || null,
                    categoryId: newTaskCategory || null,
                    dueDate: newTaskDue || null,
                    assigneeIds: newTaskAssignees,
                }),
            })
            if (res.ok) {
                const newTask = await res.json()
                setLocalTasks(prev => [...prev, {
                    ...newTask,
                    dueDate: newTask.dueDate ?? null,
                    closedAt: newTask.closedAt ?? null,
                    status: taskStatuses.find(s => s.id === newTask.statusId) || null,
                    category: newTask.category || null,
                    assignees: newTask.assignees || [],
                    comments: [],
                    attachments: [],
                }])
                setNewTaskName(""); setNewTaskDesc(""); setNewTaskDue(""); setNewTaskAssignees([]); setNewTaskCategory(""); setCategorySearch("");
                setShowAddTask(false)
            }
        } catch (e) { console.error(e) }
        setSaving(false)
    }

    const handleUpdateStatus = async (taskId: string, statusId: string) => {
        setLocalTasks(prev => prev.map(t => t.id === taskId
            ? { ...t, statusId, status: taskStatuses.find(s => s.id === statusId) || t.status }
            : t
        ))
        await fetch(`/api/projects/${project.id}/tasks/${taskId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ statusId }),
        })
    }

    const startEditTask = (task: Task) => {
        setEditingTaskId(task.id)
        setEditName(task.name)
        setEditDesc(task.description || "")
        setEditDue(task.dueDate ? task.dueDate.split("T")[0] : "")
    }

    const handleEditTask = async (taskId: string) => {
        if (!editName.trim()) return
        setSaving(true)
        setLocalTasks(prev => prev.map(t => t.id === taskId
            ? { ...t, name: editName, description: editDesc || null, dueDate: editDue || null }
            : t
        ))
        await fetch(`/api/projects/${project.id}/tasks/${taskId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: editName,
                description: editDesc || null,
                dueDate: editDue || null,
            }),
        })
        setEditingTaskId(null)
        setSaving(false)
    }

    const handleDeleteTask = async (taskId: string) => {
        if (!confirm("ลบ Task นี้?")) return
        setLocalTasks(prev => prev.filter(t => t.id !== taskId))
        await fetch(`/api/projects/${project.id}/tasks/${taskId}`, { method: "DELETE" })
    }

    const handleAddComment = async (taskId: string) => {
        const content = commentTexts[taskId]?.trim()
        if (!content) return
        const currentUser = users.find(u => u.id === currentUserId)
        const tempComment = {
            id: `temp-${Date.now()}`,
            content,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            user: currentUser || { id: currentUserId, name: "", email: "", role: "", nickname: null, position: null, avatar: null },
        }
        setLocalTasks(prev => prev.map(t => t.id === taskId
            ? { ...t, comments: [...t.comments, tempComment] }
            : t
        ))
        setCommentTexts(prev => ({ ...prev, [taskId]: "" }))
        await fetch(`/api/projects/${project.id}/tasks/${taskId}/comments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content }),
        })
    }

    const handleAddLink = async (taskId: string) => {
        const url = linkUrls[taskId]?.trim()
        if (!url) return
        const tempAttachment = {
            id: `temp-${Date.now()}`,
            type: "link",
            url,
            name: url,
            createdAt: new Date().toISOString(),
        }
        setLocalTasks(prev => prev.map(t => t.id === taskId
            ? { ...t, attachments: [...t.attachments, tempAttachment] }
            : t
        ))
        setLinkUrls(prev => ({ ...prev, [taskId]: "" }))
        await fetch(`/api/projects/${project.id}/tasks/${taskId}/attachments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url, name: url }),
        })
    }

    const handleToggleMember = async (userId: string) => {
        // Optimistic update — change local state immediately
        const newIds = localMemberIds.includes(userId)
            ? localMemberIds.filter(id => id !== userId)
            : [...localMemberIds, userId]
        setLocalMemberIds(newIds)

        await fetch(`/api/projects/${project.id}/members`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userIds: newIds }),
        })
    }

    const handleEditProject = async () => {
        if (!editProjectName.trim()) return
        setSaving(true)
        try {
            await fetch(`/api/projects/${project.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editProjectName,
                    description: editProjectDesc || null,
                    statusId: editProjectStatusId,
                    ownerId: isBoss ? editProjectOwnerId : undefined,
                    startDate: editProjectStartDate || null,
                    endDate: editProjectEndDate || null,
                }),
            })
            setLocalProject(prev => ({
                ...prev,
                name: editProjectName,
                description: editProjectDesc || null,
                statusId: editProjectStatusId,
                ownerId: editProjectOwnerId,
                startDate: editProjectStartDate || null,
                endDate: editProjectEndDate || null,
                status: projectStatuses.find(s => s.id === editProjectStatusId) || prev.status,
            }))
            setShowEditProject(false)
        } catch (e) { console.error(e) }
        setSaving(false)
    }

    const handleCompleteProject = async () => {
        if (!confirm("ยืนยันปิดโปรเจคนี้?")) return
        await fetch(`/api/projects/${project.id}/complete`, { method: "POST" })
        router.refresh()
    }

    const handleUpdateTaskAssignees = async (taskId: string, assigneeIds: string[]) => {
        const assigneeUsers = assigneeIds.map(id => {
            const user = users.find(u => u.id === id)
            return { id: `ta-${id}`, userId: id, user: user || { id, name: "", email: "", role: "", nickname: null, position: null, avatar: null } }
        })
        setLocalTasks(prev => prev.map(t => t.id === taskId
            ? { ...t, assignees: assigneeUsers }
            : t
        ))
        await fetch(`/api/projects/${project.id}/tasks/${taskId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ assigneeIds }),
        })
    }

    // Revenue handlers
    const totalRevenue = revenues.reduce((sum, r) => sum + r.amount, 0)

    const handleAddRevenue = async () => {
        if (!revenueAmount || parseFloat(revenueAmount) <= 0) return
        setRevenueSaving(true)
        try {
            const res = await fetch(`/api/projects/${project.id}/revenue`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: revenueAmount,
                    date: revenueDate,
                    type: revenueType,
                    description: revenueDesc || null,
                }),
            })
            if (res.ok) {
                const newRev = await res.json()
                setRevenues(prev => [{ ...newRev, date: newRev.date }, ...prev])
                setRevenueAmount("")
                setRevenueDesc("")
                setRevenueDate(new Date().toISOString().split("T")[0])
                setShowAddRevenue(false)
            }
        } catch (e) { console.error(e) }
        setRevenueSaving(false)
    }

    const handleDeleteRevenue = async (revenueId: string) => {
        if (!confirm("ลบรายการรายได้นี้?")) return
        try {
            await fetch(`/api/projects/${project.id}/revenue?revenueId=${revenueId}`, { method: "DELETE" })
            setRevenues(prev => prev.filter(r => r.id !== revenueId))
        } catch (e) { console.error(e) }
    }

    const statusBadgeClass = (name: string) => {
        if (name.includes("ยังไม่เริ่ม")) return "bg-gray-100 text-gray-600"
        if (name.includes("กำลัง")) return "bg-blue-100 text-blue-700"
        if (name.includes("ส่งงาน")) return "bg-orange-100 text-orange-700"
        if (name.includes("เสร็จ")) return "bg-green-100 text-green-700"
        if (name.includes("รอ")) return "bg-yellow-100 text-yellow-700"
        if (name.includes("ตรวจ")) return "bg-purple-100 text-purple-700"
        return "bg-gray-100 text-gray-600"
    }

    const categoryGroups = [
        { label: "Pre-Production", range: [1, 4] },
        { label: "On Process", range: [5, 8] },
        { label: "Post-Production", range: [9, 15] },
    ]

    const filteredCategories = taskCategories.filter(c =>
        c.name.toLowerCase().includes(categorySearch.toLowerCase())
    )

    return (
        <div className="space-y-6">
            {/* Back + Header */}
            <div>
                <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-purple-600 mb-4 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> กลับไปรายการโปรเจค
                </Link>

                <div className="bg-white rounded-2xl p-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusBadgeClass(localProject.status.name)}`}>
                                    {localProject.status.name}
                                </span>
                                {project.isCompleted && (
                                    <span className="text-xs font-medium px-3 py-1 rounded-full bg-green-100 text-green-700">✅ ปิดงานแล้ว</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-2xl font-bold text-gray-900">{localProject.name}</h1>
                                {isBossOrDev && !project.isCompleted && (
                                    <button
                                        onClick={() => setShowEditProject(!showEditProject)}
                                        className="p-1.5 rounded-lg hover:bg-purple-50 text-gray-400 hover:text-purple-600 transition-colors"
                                        title="แก้ไขโปรเจค"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            {localProject.description && (
                                <p className="text-gray-500 text-sm">{localProject.description}</p>
                            )}

                            {/* Info badges */}
                            <div className="flex flex-wrap items-center gap-4 mt-4">
                                <span className="text-sm text-gray-500 flex items-center gap-1.5">
                                    <Building2 className="w-4 h-4 text-gray-400" /> {project.client.name}
                                </span>
                                {localProject.startDate && (
                                    <span className="text-sm text-gray-500 flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        {new Date(localProject.startDate).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                                        {localProject.endDate && ` - ${new Date(localProject.endDate).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}`}
                                    </span>
                                )}
                            </div>

                            {/* Members Avatars — the main feature! */}
                            <div className="mt-5">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                                        <Users className="w-4 h-4 text-purple-500" /> ทีมงาน ({currentMembers.length} คน)
                                    </span>
                                    {isBoss && !project.isCompleted && (
                                        <button
                                            onClick={() => setShowMemberPanel(!showMemberPanel)}
                                            className="flex items-center gap-1 text-xs text-purple-500 hover:text-purple-700 transition-colors bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-full"
                                        >
                                            <UserPlus className="w-3.5 h-3.5" /> จัดการทีม
                                        </button>
                                    )}
                                </div>

                                {/* Avatar circles row */}
                                <div className="flex items-center gap-1">
                                    {currentMembers.length > 0 ? (
                                        <>
                                            <div className="flex -space-x-2">
                                                {currentMembers.map(u => (
                                                    <Avatar key={u.id} user={u} size="md" />
                                                ))}
                                            </div>
                                            <div className="ml-3 flex flex-wrap gap-1">
                                                {currentMembers.map(u => (
                                                    <span key={u.id} className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                                        {u.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <span className="text-xs text-gray-400">ยังไม่มีสมาชิก</span>
                                    )}
                                </div>

                                {/* Member management panel */}
                                {showMemberPanel && (
                                    <div className="mt-3 p-4 bg-purple-50 rounded-xl border border-purple-200">
                                        <p className="text-sm font-medium text-purple-700 mb-3">เลือกสมาชิกทีม:</p>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                            {users.map(u => {
                                                const isMember = localMemberIds.includes(u.id)
                                                return (
                                                    <button
                                                        key={u.id}
                                                        onClick={() => handleToggleMember(u.id)}
                                                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all
                              ${isMember
                                                                ? "bg-purple-200 border-2 border-purple-400 text-purple-800 font-medium shadow-sm"
                                                                : "bg-white border-2 border-transparent hover:border-purple-200 text-gray-600 hover:bg-white/80"
                                                            }`}
                                                    >
                                                        <Avatar user={u} size="sm" />
                                                        <div className="text-left min-w-0 flex-1">
                                                            <p className="truncate font-medium">{u.name}</p>
                                                            <p className="text-xs opacity-60 truncate">{u.position || u.role}</p>
                                                        </div>
                                                        {isMember && <CheckCircle2 className="w-4 h-4 text-purple-600 flex-shrink-0" />}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Progress + Complete */}
                        <div className="flex flex-col items-end gap-3 min-w-[200px]">
                            <div className="w-full bg-gray-50 rounded-xl p-4 text-center">
                                <p className="text-xs text-gray-500 mb-1">ความคืบหน้า</p>
                                <p className="text-3xl font-bold text-gray-900">{overallProgress}%</p>
                                <div className="w-full h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                                    <div className={`h-full rounded-full transition-all ${overallProgress >= 100 ? "bg-green-500" : overallProgress >= 60 ? "bg-blue-500" : overallProgress >= 30 ? "bg-yellow-500" : "bg-gray-300"}`} style={{ width: `${overallProgress}%` }} />
                                </div>
                                <p className="text-xs text-gray-400 mt-2">{doneTasks}/{totalTasks} งานเสร็จ</p>
                            </div>
                            {canComplete && (
                                <button onClick={handleCompleteProject} className="w-full sv-btn-purple py-2.5 text-sm flex items-center justify-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" /> ปิดโปรเจค (Complete)
                                </button>
                            )}
                            {isBoss && doneTasks < totalTasks && !project.isCompleted && (
                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> ทุก Task ต้องเสร็จสิ้นถึงจะปิดได้
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Project Form */}
            {showEditProject && (
                <div className="bg-white rounded-2xl p-6 border-2 border-purple-200">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Pencil className="w-4 h-4 text-purple-500" /> แก้ไขข้อมูลโปรเจค
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="text-sm font-medium text-gray-700 block mb-1">ชื่อโปรเจค *</label>
                            <input
                                value={editProjectName} onChange={e => setEditProjectName(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-sm font-medium text-gray-700 block mb-1">คำอธิบาย</label>
                            <textarea
                                value={editProjectDesc} onChange={e => setEditProjectDesc(e.target.value)}
                                rows={2}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">สถานะโปรเจค</label>
                            <select
                                value={editProjectStatusId} onChange={e => setEditProjectStatusId(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 bg-white"
                            >
                                {projectStatuses.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        {isBoss && (
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">เจ้าของโปรเจค</label>
                                <select
                                    value={editProjectOwnerId} onChange={e => setEditProjectOwnerId(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 bg-white"
                                >
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">วันเริ่มต้น</label>
                            <input type="date" value={editProjectStartDate} onChange={e => setEditProjectStartDate(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">วันสิ้นสุด</label>
                            <input type="date" value={editProjectEndDate} onChange={e => setEditProjectEndDate(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-3 mt-5">
                        <button
                            onClick={handleEditProject}
                            disabled={saving || !editProjectName.trim()}
                            className="sv-btn-purple px-6 py-2.5 text-sm flex items-center gap-2 disabled:opacity-50"
                        >
                            {saving ? "กำลังบันทึก..." : "บันทึก"}
                        </button>
                        <button
                            onClick={() => setShowEditProject(false)}
                            className="px-6 py-2.5 text-sm text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                        >
                            ยกเลิก
                        </button>
                    </div>
                </div>
            )}

            {/* Revenue Section - BOSS/DEV only */}
            {isBossOrDev && (
                <div className="bg-white rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-emerald-500" /> การเงินโปรเจค
                        </h2>
                        {!project.isCompleted && (
                            <button
                                onClick={() => setShowAddRevenue(!showAddRevenue)}
                                className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors"
                            >
                                <Plus className="w-4 h-4" /> บันทึกการรับเงิน
                            </button>
                        )}
                    </div>

                    {/* Budget Summary Cards */}
                    {project.budget != null && (
                        <div className="mb-5">
                            <div className="grid grid-cols-3 gap-3 mb-3">
                                <div className="bg-blue-50 rounded-xl p-4 text-center">
                                    <p className="text-xs text-blue-500 font-medium mb-1">มูลค่าโปรเจค</p>
                                    <p className="text-lg font-bold text-blue-700">฿{project.budget.toLocaleString()}</p>
                                </div>
                                <div className="bg-emerald-50 rounded-xl p-4 text-center">
                                    <p className="text-xs text-emerald-500 font-medium mb-1">รับเงินแล้ว</p>
                                    <p className="text-lg font-bold text-emerald-700">฿{totalRevenue.toLocaleString()}</p>
                                </div>
                                <div className={`rounded-xl p-4 text-center ${totalRevenue >= project.budget ? "bg-green-50" : "bg-amber-50"}`}>
                                    <p className={`text-xs font-medium mb-1 ${totalRevenue >= project.budget ? "text-green-500" : "text-amber-500"}`}>คงเหลือ</p>
                                    <p className={`text-lg font-bold ${totalRevenue >= project.budget ? "text-green-700" : "text-amber-700"}`}>
                                        ฿{Math.max(0, project.budget - totalRevenue).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            {/* Progress bar */}
                            <div className="bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${totalRevenue >= project.budget ? "bg-green-500" : "bg-emerald-400"}`}
                                    style={{ width: `${Math.min(100, (totalRevenue / project.budget) * 100).toFixed(1)}%` }}
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-1 text-right">
                                {Math.min(100, Math.round((totalRevenue / project.budget) * 100))}% ของมูลค่าโปรเจค
                            </p>
                        </div>
                    )}

                    {/* Add Revenue Form */}
                    {showAddRevenue && (
                        <div className="mb-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                            <h3 className="font-semibold text-gray-900 mb-3 text-sm">➕ เพิ่มรายการรายได้</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-1">จำนวนเงิน (บาท) *</label>
                                    <input
                                        type="number"
                                        value={revenueAmount}
                                        onChange={e => setRevenueAmount(e.target.value)}
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-1">วันที่ *</label>
                                    <input
                                        type="date"
                                        value={revenueDate}
                                        onChange={e => setRevenueDate(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-1">ประเภท</label>
                                    <select
                                        value={revenueType}
                                        onChange={e => setRevenueType(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-white"
                                    >
                                        <option value="รายได้โปรเจค">รายได้โปรเจค</option>
                                        <option value="มัดจำ">มัดจำ</option>
                                        <option value="งวดที่ 1">งวดที่ 1</option>
                                        <option value="งวดที่ 2">งวดที่ 2</option>
                                        <option value="งวดที่ 3">งวดที่ 3</option>
                                        <option value="งวดสุดท้าย">งวดสุดท้าย</option>
                                        <option value="อื่นๆ">อื่นๆ</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-1">หมายเหตุ</label>
                                    <input
                                        value={revenueDesc}
                                        onChange={e => setRevenueDesc(e.target.value)}
                                        placeholder="รายละเอียดเพิ่มเติม"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-3 mt-4">
                                <button
                                    onClick={handleAddRevenue}
                                    disabled={revenueSaving || !revenueAmount || parseFloat(revenueAmount) <= 0}
                                    className="flex items-center gap-2 px-5 py-2 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                                >
                                    {revenueSaving ? "กำลังบันทึก..." : "บันทึก"}
                                </button>
                                <button
                                    onClick={() => setShowAddRevenue(false)}
                                    className="px-5 py-2 text-sm text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                                >
                                    ยกเลิก
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Revenue List */}
                    {revenues.length > 0 ? (
                        <div className="space-y-2">
                            {revenues.map(rev => (
                                <div key={rev.id} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
                                            <Receipt className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{rev.type}</p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(rev.date).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                                                {rev.description && ` · ${rev.description}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-bold text-emerald-600">฿{rev.amount.toLocaleString()}</span>
                                        {!project.isCompleted && (
                                            <button
                                                onClick={() => handleDeleteRevenue(rev.id)}
                                                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                                title="ลบรายการ"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 text-center py-4">ยังไม่มีรายการรายได้</p>
                    )}
                </div>
            )}

            {/* Tasks Section */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <FolderKanban className="w-5 h-5 text-blue-500" /> รายการงาน ({totalTasks})
                    </h2>
                    {!project.isCompleted && (
                        <button onClick={() => setShowAddTask(!showAddTask)} className="sv-btn-purple flex items-center gap-2 px-4 py-2 text-sm">
                            <Plus className="w-4 h-4" /> เพิ่ม Task
                        </button>
                    )}
                </div>

                {/* Add Task Form */}
                {showAddTask && (
                    <div className="bg-white rounded-2xl p-5 mb-4 border-2 border-purple-200 border-dashed">
                        <h3 className="font-semibold text-gray-900 mb-3">➕ สร้าง Task ใหม่</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">ชื่องาน *</label>
                                <input
                                    value={newTaskName} onChange={e => setNewTaskName(e.target.value)}
                                    placeholder="เช่น ถ่ายทำคลิปที่ 1"
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">รายละเอียด</label>
                                <textarea
                                    value={newTaskDesc} onChange={e => setNewTaskDesc(e.target.value)}
                                    placeholder="รายละเอียดเพิ่มเติม..."
                                    rows={2}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
                                />
                            </div>
                            <div className="relative">
                                <label className="text-sm font-medium text-gray-700 block mb-1">หมวดหมู่งาน</label>
                                <div className="relative">
                                    <input
                                        value={newTaskCategory ? taskCategories.find(c => c.id === newTaskCategory)?.name || "" : categorySearch}
                                        onChange={e => { setCategorySearch(e.target.value); setNewTaskCategory(""); setShowCategoryDropdown(true); }}
                                        onFocus={() => setShowCategoryDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 200)}
                                        placeholder="ค้นหาหมวดหมู่..."
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
                                    />
                                    {newTaskCategory && (
                                        <button onClick={() => { setNewTaskCategory(""); setCategorySearch(""); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                {showCategoryDropdown && (
                                    <div className="absolute z-20 w-full mt-1 bg-white rounded-xl border border-gray-200 shadow-lg max-h-60 overflow-y-auto">
                                        {categoryGroups.map(group => {
                                            const items = filteredCategories.filter(c => c.order >= group.range[0] && c.order <= group.range[1])
                                            if (items.length === 0) return null
                                            return (
                                                <div key={group.label}>
                                                    <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase bg-gray-50 sticky top-0">{group.label}</div>
                                                    {items.map(cat => (
                                                        <button
                                                            key={cat.id}
                                                            type="button"
                                                            onClick={() => { setNewTaskCategory(cat.id); setCategorySearch(""); setShowCategoryDropdown(false); }}
                                                            className="w-full text-left px-4 py-2 text-sm hover:bg-purple-50 transition-colors"
                                                        >
                                                            {cat.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            )
                                        })}
                                        {filteredCategories.length === 0 && (
                                            <div className="px-4 py-3 text-sm text-gray-400">ไม่พบหมวดหมู่</div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-1">กำหนดส่ง</label>
                                    <input type="date" value={newTaskDue} onChange={e => setNewTaskDue(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-1">มอบหมายให้</label>
                                    <div className="space-y-1 max-h-[120px] overflow-y-auto border border-gray-200 rounded-xl p-2">
                                        {users.map(u => (
                                            <label key={u.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded-lg cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={newTaskAssignees.includes(u.id)}
                                                    onChange={e => {
                                                        if (e.target.checked) setNewTaskAssignees(prev => [...prev, u.id])
                                                        else setNewTaskAssignees(prev => prev.filter(id => id !== u.id))
                                                    }}
                                                    className="accent-purple-500"
                                                />
                                                <Avatar user={u} size="sm" />
                                                <span className="text-sm text-gray-700">{u.nickname || u.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button onClick={() => setShowAddTask(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">ยกเลิก</button>
                                <button onClick={handleCreateTask} disabled={saving || !newTaskName.trim()}
                                    className="sv-btn-purple px-5 py-2 text-sm disabled:opacity-50">
                                    {saving ? "กำลังบันทึก..." : "💾 บันทึก"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Task List */}
                <div className="space-y-3">
                    {localTasks.map(task => {
                        const isExpanded = expandedTaskId === task.id
                        const statusName = task.status?.name || "ยังไม่เริ่ม"
                        const isDone = statusName.includes("เสร็จ")

                        return (
                            <div key={task.id} className="bg-white rounded-2xl overflow-hidden">
                                {/* Task Header */}
                                <div
                                    className="p-4 cursor-pointer flex items-center justify-between hover:bg-gray-50/50 transition-colors"
                                    onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isDone ? "bg-green-100" : "bg-blue-100"}`}>
                                            {isDone
                                                ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                                                : <Clock className="w-4 h-4 text-blue-600" />
                                            }
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2.5">
                                                <p className={`font-medium text-sm ${isDone ? "text-gray-400" : "text-gray-900"}`}>{task.name}</p>
                                                {task.category && (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-100 text-indigo-600">
                                                        {task.category.name}
                                                    </span>
                                                )}
                                                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full flex-shrink-0 ${statusBadgeClass(statusName)}`}>
                                                    {statusName}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                                {task.createdBy && (
                                                    <div className="flex items-center gap-1.5">
                                                        <Avatar user={task.createdBy} size="sm" />
                                                        <span className="text-xs text-gray-400">
                                                            สร้างโดย <span className="font-medium text-gray-500">{task.createdBy.nickname || task.createdBy.name}</span>
                                                        </span>
                                                    </div>
                                                )}
                                                {task.assignees.length > 0 && (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-xs text-gray-300">→</span>
                                                        <div className="flex -space-x-1">
                                                            {task.assignees.slice(0, 3).map(a => (
                                                                <Avatar key={a.id} user={a.user} size="sm" />
                                                            ))}
                                                        </div>
                                                        <span className="text-xs text-gray-400">
                                                            {task.assignees.map(a => a.user.nickname || a.user.name).join(", ")}
                                                        </span>
                                                    </div>
                                                )}
                                                {task.dueDate && (
                                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(task.dueDate).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        {task.comments.length > 0 && (
                                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                                <MessageCircle className="w-3 h-3" /> {task.comments.length}
                                            </span>
                                        )}
                                        {task.attachments.length > 0 && (
                                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                                <Link2 className="w-3 h-3" /> {task.attachments.length}
                                            </span>
                                        )}
                                        <div className={`p-1 rounded-lg ${isExpanded ? "bg-purple-100" : ""}`}>
                                            {isExpanded ? <ChevronUp className="w-4 h-4 text-purple-600" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Task Detail */}
                                {isExpanded && (
                                    <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4 space-y-4">

                                        {/* Edit Task Form */}
                                        {!project.isCompleted && editingTaskId === task.id ? (
                                            <div className="bg-white rounded-xl p-4 border-2 border-purple-200">
                                                <h4 className="text-sm font-medium text-purple-700 mb-3 flex items-center gap-1.5">
                                                    <Pencil className="w-4 h-4" /> แก้ไข Task
                                                </h4>
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="text-xs font-medium text-gray-600 block mb-1">ชื่องาน *</label>
                                                        <input value={editName} onChange={e => setEditName(e.target.value)}
                                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400" />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium text-gray-600 block mb-1">รายละเอียด</label>
                                                        <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={2}
                                                            placeholder="รายละเอียดเพิ่มเติม..."
                                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400" />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium text-gray-600 block mb-1">กำหนดส่ง</label>
                                                        <input type="date" value={editDue} onChange={e => setEditDue(e.target.value)}
                                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400" />
                                                    </div>
                                                    <div className="flex gap-2 pt-1">
                                                        <button onClick={() => setEditingTaskId(null)}
                                                            className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">ยกเลิก</button>
                                                        <button onClick={() => handleEditTask(task.id)} disabled={saving || !editName.trim()}
                                                            className="sv-btn-purple px-5 py-2 text-sm disabled:opacity-50">
                                                            {saving ? "กำลังบันทึก..." : "💾 บันทึก"}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {/* Edit button + description */}
                                                {!project.isCompleted && (
                                                    <div className="flex justify-end">
                                                        <button onClick={() => startEditTask(task)}
                                                            className="flex items-center gap-1.5 text-xs text-purple-500 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-full transition-colors">
                                                            <Pencil className="w-3.5 h-3.5" /> แก้ไข Task
                                                        </button>
                                                    </div>
                                                )}
                                                {task.description && (
                                                    <p className="text-sm text-gray-600 bg-white rounded-xl p-3">{task.description}</p>
                                                )}
                                            </>
                                        )}

                                        {/* Created by / Assigned by */}
                                        {task.createdBy && (
                                            <div className="flex items-center gap-2.5 text-sm text-gray-500 bg-white rounded-xl px-4 py-3">
                                                <Avatar user={task.createdBy} size="md" />
                                                <div>
                                                    <span className="text-xs text-gray-400">สร้างโดย</span>
                                                    <p className="font-medium text-gray-700">{task.createdBy.nickname || task.createdBy.name}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Task Status Dropdown */}
                                        {!project.isCompleted && (
                                            <div className="bg-white rounded-xl p-4">
                                                <label className="text-sm font-medium text-gray-700 block mb-2">สถานะงาน</label>
                                                <select
                                                    value={task.statusId || ""}
                                                    onChange={e => handleUpdateStatus(task.id, e.target.value)}
                                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 bg-white"
                                                >
                                                    {taskStatuses.map((s: any) => (
                                                        <option key={s.id} value={s.id}>{s.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {/* Assignees management */}
                                        {!project.isCompleted && (
                                            <div className="bg-white rounded-xl p-4">
                                                <label className="text-sm font-medium text-gray-700 block mb-2">มอบหมายให้:</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {users.map(u => {
                                                        const isAssigned = task.assignees.some(a => a.userId === u.id)
                                                        return (
                                                            <button key={u.id}
                                                                onClick={() => {
                                                                    const newIds = isAssigned
                                                                        ? task.assignees.filter(a => a.userId !== u.id).map(a => a.userId)
                                                                        : [...task.assignees.map(a => a.userId), u.id]
                                                                    handleUpdateTaskAssignees(task.id, newIds)
                                                                }}
                                                                className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border transition-colors ${isAssigned
                                                                    ? "bg-purple-100 border-purple-300 text-purple-700 font-medium"
                                                                    : "bg-white border-gray-200 text-gray-500 hover:border-purple-300"
                                                                    }`}
                                                            >
                                                                <Avatar user={u} size="sm" />
                                                                {u.name}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Link Attachments */}
                                        <div className="bg-white rounded-xl p-4">
                                            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                                                <Link2 className="w-4 h-4 text-blue-500" /> ลิ้งค์ส่งงาน
                                            </h4>
                                            {task.attachments.length > 0 && (
                                                <div className="space-y-1.5 mb-3">
                                                    {task.attachments.map(att => (
                                                        <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer"
                                                            className="block text-sm text-blue-600 hover:text-blue-800 underline truncate">
                                                            🔗 {att.name || att.url}
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                            {!project.isCompleted && (
                                                <div className="flex gap-2">
                                                    <input
                                                        value={linkUrls[task.id] || ""}
                                                        onChange={e => setLinkUrls(prev => ({ ...prev, [task.id]: e.target.value }))}
                                                        placeholder="วาง URL ที่นี่..."
                                                        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
                                                    />
                                                    <button onClick={() => handleAddLink(task.id)}
                                                        className="px-3 py-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 text-sm font-medium transition-colors">
                                                        <Link2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Comments */}
                                        <div className="bg-white rounded-xl p-4">
                                            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1.5">
                                                <MessageCircle className="w-4 h-4 text-purple-500" /> ความคิดเห็น ({task.comments.length})
                                            </h4>
                                            {task.comments.length > 0 && (
                                                <div className="space-y-3 mb-3">
                                                    {task.comments.map(comment => (
                                                        <div key={comment.id} className="flex gap-3">
                                                            <Avatar user={comment.user} size="sm" />
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-medium text-gray-900">{comment.user.nickname || comment.user.name}</span>
                                                                    <span className="text-xs text-gray-400">
                                                                        {new Date(comment.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                                                                        {" "}
                                                                        {new Date(comment.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-gray-600 mt-0.5">{comment.content}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="flex gap-2">
                                                <input
                                                    value={commentTexts[task.id] || ""}
                                                    onChange={e => setCommentTexts(prev => ({ ...prev, [task.id]: e.target.value }))}
                                                    placeholder="พิมพ์ความคิดเห็น..."
                                                    onKeyDown={e => { if (e.key === "Enter") handleAddComment(task.id) }}
                                                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
                                                />
                                                <button onClick={() => handleAddComment(task.id)}
                                                    className="px-3 py-2 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 text-sm font-medium transition-colors">
                                                    <Send className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Delete task */}
                                        {isBossOrDev && !project.isCompleted && editingTaskId !== task.id && (
                                            <div className="flex justify-end">
                                                <button onClick={() => handleDeleteTask(task.id)}
                                                    className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition-colors">
                                                    <Trash2 className="w-3.5 h-3.5" /> ลบ Task นี้
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}

                    {localTasks.length === 0 && (
                        <div className="text-center text-gray-400 py-12 bg-white rounded-2xl">
                            ยังไม่มี Task — กดปุ่ม &quot;เพิ่ม Task&quot; เพื่อสร้าง
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
