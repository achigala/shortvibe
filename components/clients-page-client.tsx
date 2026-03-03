"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
    Search, Plus, ChevronDown, ChevronUp,
    FolderKanban, Phone, Mail, Building2, Pencil, Trash2, X
} from "lucide-react"

type ClientProject = {
    id: string
    name: string
    isCompleted: boolean
    startDate: string | null
    endDate: string | null
    status: string
    owner: string
    amount: number
}

type Client = {
    id: string
    name: string
    contactName: string | null
    email: string | null
    phone: string | null
    businessType: string | null
    createdAt: string
    projects: ClientProject[]
    totalRevenue: number
}

const statusColor = (status: string) => {
    if (status.includes("รอ")) return "bg-yellow-100 text-yellow-700"
    if (status.includes("กำลัง")) return "bg-blue-100 text-blue-700"
    if (status.includes("ตรวจ")) return "bg-purple-100 text-purple-700"
    if (status.includes("เสร็จ")) return "bg-green-100 text-green-700"
    return "bg-gray-100 text-gray-600"
}

type ModalMode = "create" | "edit" | null

export default function ClientsPageClient({ clients, isBossOrDev }: { clients: Client[], isBossOrDev: boolean }) {
    const router = useRouter()
    const [search, setSearch] = useState("")
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [modalMode, setModalMode] = useState<ModalMode>(null)
    const [editingClient, setEditingClient] = useState<Client | null>(null)
    const [saving, setSaving] = useState(false)

    // Form state
    const [formName, setFormName] = useState("")
    const [formContact, setFormContact] = useState("")
    const [formEmail, setFormEmail] = useState("")
    const [formPhone, setFormPhone] = useState("")
    const [formBusiness, setFormBusiness] = useState("")

    const filtered = clients.filter(c =>
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.contactName?.toLowerCase().includes(search.toLowerCase()) ||
        c.businessType?.toLowerCase().includes(search.toLowerCase())
    )

    const openCreate = () => {
        setFormName("")
        setFormContact("")
        setFormEmail("")
        setFormPhone("")
        setFormBusiness("")
        setEditingClient(null)
        setModalMode("create")
    }

    const openEdit = (client: Client) => {
        setFormName(client.name)
        setFormContact(client.contactName || "")
        setFormEmail(client.email || "")
        setFormPhone(client.phone || "")
        setFormBusiness(client.businessType || "")
        setEditingClient(client)
        setModalMode("edit")
    }

    const handleSave = async () => {
        if (!formName.trim()) return
        setSaving(true)
        try {
            if (modalMode === "create") {
                await fetch("/api/clients", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: formName, contactName: formContact,
                        email: formEmail, phone: formPhone, businessType: formBusiness,
                    }),
                })
            } else if (modalMode === "edit" && editingClient) {
                await fetch(`/api/clients/${editingClient.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: formName, contactName: formContact,
                        email: formEmail, phone: formPhone, businessType: formBusiness,
                    }),
                })
            }
            setModalMode(null)
            router.refresh()
        } catch (e) {
            console.error(e)
        }
        setSaving(false)
    }

    const handleDelete = async (clientId: string) => {
        if (!confirm("ต้องการลบลูกค้ารายนี้จริงหรือ?")) return
        try {
            await fetch(`/api/clients/${clientId}`, { method: "DELETE" })
            router.refresh()
        } catch (e) {
            console.error(e)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">ลูกค้า</h1>
                    <p className="text-gray-500 mt-1">จัดการข้อมูลลูกค้า ({filtered.length} ราย)</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            placeholder="ค้นหาลูกค้า..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 w-[200px]"
                        />
                    </div>
                    {isBossOrDev && (
                        <button onClick={openCreate} className="sv-btn-purple flex items-center gap-2 px-5 py-2.5 text-sm">
                            <Plus className="w-4 h-4" />
                            เพิ่มลูกค้า
                        </button>
                    )}
                </div>
            </div>

            {/* Client List */}
            <div className="space-y-3">
                {filtered.map((client) => {
                    const isExpanded = expandedId === client.id
                    const activeProjects = client.projects.filter(p => !p.isCompleted).length

                    return (
                        <div key={client.id} className="bg-white rounded-2xl sv-card-hover overflow-hidden">
                            {/* Client Row */}
                            <div
                                className="p-5 cursor-pointer flex items-center justify-between"
                                onClick={() => setExpandedId(isExpanded ? null : client.id)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                        {client.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{client.name}</h3>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            {client.businessType && (
                                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                                    <Building2 className="w-3 h-3" /> {client.businessType}
                                                </span>
                                            )}
                                            {client.contactName && (
                                                <span className="text-xs text-gray-400">{client.contactName}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full flex items-center gap-1">
                                            <FolderKanban className="w-3 h-3" />
                                            {client.projects.length} โปรเจค
                                        </span>
                                        {activeProjects > 0 && (
                                            <span className="text-xs font-medium bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
                                                {activeProjects} กำลังทำ
                                            </span>
                                        )}
                                    </div>

                                    {isBossOrDev && (
                                        <span className="text-sm font-semibold text-gray-700 min-w-[80px] text-right">
                                            ฿{client.totalRevenue.toLocaleString()}
                                        </span>
                                    )}

                                    <div className={`p-1 rounded-lg transition-colors ${isExpanded ? "bg-purple-100" : "hover:bg-gray-100"}`}>
                                        {isExpanded
                                            ? <ChevronUp className="w-4 h-4 text-purple-600" />
                                            : <ChevronDown className="w-4 h-4 text-gray-400" />
                                        }
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Detail */}
                            {isExpanded && (
                                <div className="border-t border-gray-100 bg-gray-50/50">
                                    {/* Contact Info + Action Buttons */}
                                    <div className="px-5 py-3 flex flex-wrap items-center justify-between gap-4 border-b border-gray-100">
                                        <div className="flex flex-wrap gap-4">
                                            {client.email && (
                                                <span className="text-sm text-gray-500 flex items-center gap-1.5">
                                                    <Mail className="w-3.5 h-3.5 text-gray-400" /> {client.email}
                                                </span>
                                            )}
                                            {client.phone && (
                                                <span className="text-sm text-gray-500 flex items-center gap-1.5">
                                                    <Phone className="w-3.5 h-3.5 text-gray-400" /> {client.phone}
                                                </span>
                                            )}
                                            <span className="text-sm text-gray-400">
                                                ลูกค้าตั้งแต่: {new Date(client.createdAt).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}
                                            </span>
                                        </div>
                                        {isBossOrDev && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); openEdit(client) }}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm font-medium transition-colors"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" /> แก้ไข
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(client.id) }}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-sm font-medium transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" /> ลบ
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Projects */}
                                    <div className="px-5 py-4">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                            <FolderKanban className="w-4 h-4 text-blue-500" />
                                            โปรเจค ({client.projects.length})
                                        </h4>
                                        {client.projects.length === 0 ? (
                                            <p className="text-sm text-gray-400 py-2">ยังไม่มีโปรเจค</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {client.projects.map(proj => (
                                                    <Link key={proj.id} href={`/projects/${proj.id}`}
                                                        className="flex items-center justify-between py-2.5 px-4 rounded-xl bg-white hover:bg-purple-50 hover:shadow-sm transition-all cursor-pointer group">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${proj.isCompleted ? "bg-green-500" : "bg-blue-500"}`} />
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900 group-hover:text-purple-700 transition-colors">{proj.name}</p>
                                                                <p className="text-xs text-gray-400">
                                                                    {proj.owner}
                                                                    {proj.startDate && ` · ${new Date(proj.startDate).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}`}
                                                                    {proj.endDate && ` - ${new Date(proj.endDate).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}`}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${statusColor(proj.status)}`}>
                                                                {proj.status}
                                                            </span>
                                                            {isBossOrDev && proj.amount > 0 && (
                                                                <span className="text-sm font-semibold text-emerald-600">฿{proj.amount.toLocaleString()}</span>
                                                            )}
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}

                {filtered.length === 0 && (
                    <div className="text-center text-gray-400 py-12 bg-white rounded-2xl">
                        ไม่พบลูกค้า
                    </div>
                )}
            </div>

            {/* Modal: Create / Edit Client */}
            {modalMode && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalMode(null)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-gray-900">
                                {modalMode === "create" ? "➕ เพิ่มลูกค้าใหม่" : "✏️ แก้ไขข้อมูลลูกค้า"}
                            </h2>
                            <button onClick={() => setModalMode(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">ชื่อลูกค้า *</label>
                                <input
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    placeholder="เช่น บริษัท ABC จำกัด"
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">ชื่อผู้ติดต่อ</label>
                                <input
                                    value={formContact}
                                    onChange={(e) => setFormContact(e.target.value)}
                                    placeholder="เช่น คุณสมชาย"
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-1">อีเมล</label>
                                    <input
                                        type="email"
                                        value={formEmail}
                                        onChange={(e) => setFormEmail(e.target.value)}
                                        placeholder="email@example.com"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-1">เบอร์โทร</label>
                                    <input
                                        value={formPhone}
                                        onChange={(e) => setFormPhone(e.target.value)}
                                        placeholder="0XX-XXX-XXXX"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">หมวดธุรกิจ</label>
                                <input
                                    value={formBusiness}
                                    onChange={(e) => setFormBusiness(e.target.value)}
                                    placeholder="เช่น คลินิกเสริมความงาม"
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setModalMode(null)}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !formName.trim()}
                                className="flex-1 sv-btn-purple px-4 py-2.5 text-sm font-medium disabled:opacity-50"
                            >
                                {saving ? "กำลังบันทึก..." : "💾 บันทึก"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
