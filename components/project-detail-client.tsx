"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
    ArrowLeft, Calendar, User, Building2, Clock,
    Plus, ChevronDown, ChevronUp, Send, Link2,
    MessageCircle, CheckCircle2, Trash2, Users,
    FolderKanban, AlertCircle, UserPlus, Pencil
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
}

type Project = {
    id: string; name: string; description: string | null;
    clientId: string; ownerId: string; statusId: string;
    isCompleted: boolean;
    startDate: string | null; endDate: string | null;
    createdAt: string; updatedAt: string;
    client: { id: string; name: string; businessType: string | null;[key: string]: any };
    owner: SerializedUser;
    status: { id: string; name: string;[key: string]: any };
    members: ProjectMember[];
    tasks: Task[];
}

type Props = {
    project: Project
    users: SerializedUser[]
    taskStatuses: any[]
    isBoss: boolean
    isBossOrDev: boolean
    currentUserId: string
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

export default function ProjectDetailClient({ project, users, taskStatuses, isBoss, isBossOrDev, currentUserId }: Props) {
    const router = useRouter()
    const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
    const [showAddTask, setShowAddTask] = useState(false)
    const [showMemberPanel, setShowMemberPanel] = useState(false)

    // New task form
    const [newTaskName, setNewTaskName] = useState("")
    const [newTaskDesc, setNewTaskDesc] = useState("")
    const [newTaskDue, setNewTaskDue] = useState("")
    const [newTaskAssignees, setNewTaskAssignees] = useState<string[]>([])

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
    const totalTasks = project.tasks.length
    const doneTasks = project.tasks.filter(t => t.status?.name?.includes("เสร็จ")).length
    const overallProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
    const canComplete = isBoss && doneTasks === totalTasks && totalTasks > 0 && !project.isCompleted

    // === HANDLERS ===
    const handleCreateTask = async () => {
        if (!newTaskName.trim()) return
        setSaving(true)
        try {
            await fetch(`/api/projects/${project.id}/tasks`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newTaskName,
                    description: newTaskDesc || null,
                    dueDate: newTaskDue || null,
                    assigneeIds: newTaskAssignees,
                }),
            })
            setNewTaskName(""); setNewTaskDesc(""); setNewTaskDue(""); setNewTaskAssignees([])
            setShowAddTask(false)
            router.refresh()
        } catch (e) { console.error(e) }
        setSaving(false)
    }

    const handleUpdateStatus = async (taskId: string, statusId: string) => {
        await fetch(`/api/projects/${project.id}/tasks/${taskId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ statusId }),
        })
        router.refresh()
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
        router.refresh()
    }

    const handleDeleteTask = async (taskId: string) => {
        if (!confirm("ลบ Task นี้?")) return
        await fetch(`/api/projects/${project.id}/tasks/${taskId}`, { method: "DELETE" })
        router.refresh()
    }

    const handleAddComment = async (taskId: string) => {
        const content = commentTexts[taskId]?.trim()
        if (!content) return
        await fetch(`/api/projects/${project.id}/tasks/${taskId}/comments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content }),
        })
        setCommentTexts(prev => ({ ...prev, [taskId]: "" }))
        router.refresh()
    }

    const handleAddLink = async (taskId: string) => {
        const url = linkUrls[taskId]?.trim()
        if (!url) return
        await fetch(`/api/projects/${project.id}/tasks/${taskId}/attachments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url, name: url }),
        })
        setLinkUrls(prev => ({ ...prev, [taskId]: "" }))
        router.refresh()
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
        router.refresh()
    }

    const handleCompleteProject = async () => {
        if (!confirm("ยืนยันปิดโปรเจคนี้?")) return
        await fetch(`/api/projects/${project.id}/complete`, { method: "POST" })
        router.refresh()
    }

    const handleUpdateTaskAssignees = async (taskId: string, assigneeIds: string[]) => {
        await fetch(`/api/projects/${project.id}/tasks/${taskId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ assigneeIds }),
        })
        router.refresh()
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
                                <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusBadgeClass(project.status.name)}`}>
                                    {project.status.name}
                                </span>
                                {project.isCompleted && (
                                    <span className="text-xs font-medium px-3 py-1 rounded-full bg-green-100 text-green-700">✅ ปิดงานแล้ว</span>
                                )}
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-1">{project.name}</h1>
                            {project.description && (
                                <p className="text-gray-500 text-sm">{project.description}</p>
                            )}

                            {/* Info badges */}
                            <div className="flex flex-wrap items-center gap-4 mt-4">
                                <span className="text-sm text-gray-500 flex items-center gap-1.5">
                                    <Building2 className="w-4 h-4 text-gray-400" /> {project.client.name}
                                </span>
                                {project.startDate && (
                                    <span className="text-sm text-gray-500 flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        {new Date(project.startDate).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                                        {project.endDate && ` - ${new Date(project.endDate).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}`}
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
                    {project.tasks.map(task => {
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

                    {project.tasks.length === 0 && (
                        <div className="text-center text-gray-400 py-12 bg-white rounded-2xl">
                            ยังไม่มี Task — กดปุ่ม &quot;เพิ่ม Task&quot; เพื่อสร้าง
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
