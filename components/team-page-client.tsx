"use client"

import { useState } from "react"
import {
    Mail, Phone, CalendarDays, X, Save,
    Search, UserPlus, Eye, EyeOff
} from "lucide-react"

type User = {
    id: string
    name: string
    email: string
    role: string
    nickname: string | null
    phone: string | null
    position: string | null
    bio: string | null
    skills: string | null
    themeColor: string | null
    createdAt: string
    isApproved: boolean
}

const roleColors: Record<string, string> = {
    BOSS: "bg-purple-100 text-purple-700",
    DEVELOPER: "bg-blue-100 text-blue-700",
    STAFF: "bg-green-100 text-green-700",
}

const roleLabels: Record<string, string> = {
    BOSS: "ผู้บริหาร",
    DEVELOPER: "นักพัฒนา",
    STAFF: "พนักงาน",
}

const themeGradients: Record<string, string> = {
    purple: "from-purple-500 to-purple-600",
    blue: "from-blue-500 to-blue-600",
    pink: "from-pink-500 to-pink-600",
    green: "from-green-500 to-green-600",
    orange: "from-orange-500 to-orange-600",
}

const inputClass = "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"

export default function TeamPageClient({ users: initialUsers, isBossOrDev }: { users: User[], isBossOrDev: boolean }) {
    const [users, setUsers] = useState(initialUsers)
    const [search, setSearch] = useState("")
    const [filterRole, setFilterRole] = useState("")
    const [editUser, setEditUser] = useState<User | null>(null)
    const [saving, setSaving] = useState(false)

    // Add member state
    const [showAddModal, setShowAddModal] = useState(false)
    const [addForm, setAddForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "STAFF",
        phone: "",
        position: "",
        nickname: "",
    })
    const [addError, setAddError] = useState("")
    const [addLoading, setAddLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const filteredUsers = users.filter(u => {
        const matchSearch = !search ||
            u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase()) ||
            u.nickname?.toLowerCase().includes(search.toLowerCase())
        const matchRole = !filterRole || u.role === filterRole
        return matchSearch && matchRole
    })

    // --- EDIT ---
    const handleSave = async () => {
        if (!editUser) return
        setSaving(true)
        try {
            const res = await fetch(`/api/users/${editUser.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editUser),
            })
            if (res.ok) {
                setUsers(prev => prev.map(u => u.id === editUser.id ? editUser : u))
                setEditUser(null)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setSaving(false)
        }
    }

    // --- ADD ---
    function resetAddForm() {
        setAddForm({ name: "", email: "", password: "", role: "STAFF", phone: "", position: "", nickname: "" })
        setAddError("")
        setShowPassword(false)
    }

    const handleAdd = async () => {
        setAddError("")
        if (!addForm.name.trim() || !addForm.email.trim() || !addForm.password.trim()) {
            setAddError("กรุณากรอกชื่อ อีเมล และรหัสผ่าน")
            return
        }
        setAddLoading(true)
        try {
            const res = await fetch("/api/team", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(addForm),
            })
            const data = await res.json()
            if (!res.ok) {
                setAddError(data.error || "เกิดข้อผิดพลาด")
                return
            }
            // เพิ่มลงใน list ทันที
            setUsers(prev => [...prev, data.user])
            setShowAddModal(false)
            resetAddForm()
        } catch (err) {
            setAddError("เกิดข้อผิดพลาด กรุณาลองใหม่")
        } finally {
            setAddLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">จัดการทีมงาน</h1>
                    <p className="text-gray-500 mt-1">ดูและจัดการข้อมูลสมาชิกทีมงาน</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            placeholder="ค้นหาทีมงาน..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 w-[200px]"
                        />
                    </div>
                    <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    >
                        <option value="">ทั้งหมด</option>
                        <option value="BOSS">ผู้บริหาร</option>
                        <option value="DEVELOPER">นักพัฒนา</option>
                        <option value="STAFF">พนักงาน</option>
                    </select>
                    {isBossOrDev && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="sv-btn-purple flex items-center gap-2 px-5 py-2.5 text-sm"
                        >
                            <UserPlus className="w-4 h-4" />
                            เพิ่มทีมงาน
                        </button>
                    )}
                </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredUsers.map((user) => {
                    const gradient = themeGradients[user.themeColor || "purple"] || themeGradients.purple
                    const skillList = user.skills ? user.skills.split(",").map(s => s.trim()).filter(Boolean) : []
                    const initial = user.nickname?.charAt(0) || user.name.charAt(0)

                    return (
                        <div
                            key={user.id}
                            className="bg-white rounded-2xl p-6 sv-card-hover cursor-pointer"
                            onClick={() => isBossOrDev && setEditUser(user)}
                        >
                            {/* Top: Avatar + Name + Role */}
                            <div className="flex items-start gap-4 mb-4">
                                <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xl font-bold flex-shrink-0`}>
                                    {initial}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 text-base">{user.name}</h3>
                                    {user.position && (
                                        <p className="text-xs text-gray-400 mt-0.5">{user.position}</p>
                                    )}
                                    <span className={`mt-1.5 inline-block text-xs font-medium px-2.5 py-0.5 rounded-full ${roleColors[user.role] || roleColors.STAFF}`}>
                                        {roleLabels[user.role] || user.role}
                                    </span>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                    <span className="truncate">{user.email}</span>
                                </div>
                                {user.phone && (
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                        <span>{user.phone}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <CalendarDays className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                    <span>เริ่มงาน: {new Date(user.createdAt).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}</span>
                                </div>
                            </div>

                            {/* Skills */}
                            {skillList.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {skillList.slice(0, 3).map((skill, idx) => (
                                        <span key={idx} className="text-[11px] text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md font-medium">
                                            {skill}
                                        </span>
                                    ))}
                                    {skillList.length > 3 && (
                                        <span className="text-[11px] text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                                            +{skillList.length - 3}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
                {filteredUsers.length === 0 && (
                    <div className="col-span-full text-center text-gray-400 py-12">
                        ไม่พบทีมงาน
                    </div>
                )}
            </div>

            {/* ===== Add Member Modal ===== */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setShowAddModal(false); resetAddForm() }}>
                    <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900">เพิ่มพนักงานใหม่</h2>
                            <button onClick={() => { setShowAddModal(false); resetAddForm() }} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        {/* Form */}
                        <div className="p-6 space-y-4">
                            {addError && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">
                                    {addError}
                                </div>
                            )}

                            {/* ชื่อ + ชื่อเล่น */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อ-นามสกุล *</label>
                                    <input
                                        value={addForm.name}
                                        onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                                        placeholder="ชื่อจริง นามสกุล"
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อเล่น</label>
                                    <input
                                        value={addForm.nickname}
                                        onChange={(e) => setAddForm({ ...addForm, nickname: e.target.value })}
                                        placeholder="ชื่อเล่น"
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            {/* อีเมล */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">อีเมล *</label>
                                <input
                                    type="email"
                                    value={addForm.email}
                                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                                    placeholder="email@example.com"
                                    className={inputClass}
                                />
                            </div>

                            {/* รหัสผ่าน */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">รหัสผ่าน *</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={addForm.password}
                                        onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                                        placeholder="ตั้งรหัสผ่านเริ่มต้น"
                                        className={`${inputClass} pr-10`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">พนักงานสามารถเปลี่ยนรหัสผ่านได้ภายหลัง</p>
                            </div>

                            {/* เบอร์โทร */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">เบอร์โทรศัพท์</label>
                                <input
                                    value={addForm.phone}
                                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                                    placeholder="089-XXX-XXXX"
                                    className={inputClass}
                                />
                            </div>

                            {/* สิทธิ์ + ตำแหน่ง */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">สิทธิ์</label>
                                    <select
                                        value={addForm.role}
                                        onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                                        className={inputClass}
                                    >
                                        <option value="STAFF">พนักงาน</option>
                                        <option value="DEVELOPER">นักพัฒนา</option>
                                        <option value="BOSS">ผู้บริหาร</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">ตำแหน่ง</label>
                                    <input
                                        value={addForm.position}
                                        onChange={(e) => setAddForm({ ...addForm, position: e.target.value })}
                                        placeholder="เช่น Content Creator"
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
                            <button
                                onClick={() => { setShowAddModal(false); resetAddForm() }}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                <X className="w-4 h-4" />
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleAdd}
                                disabled={addLoading}
                                className="sv-btn-purple flex items-center gap-2 px-5 py-2.5 text-sm disabled:opacity-50"
                            >
                                <UserPlus className="w-4 h-4" />
                                {addLoading ? "กำลังเพิ่ม..." : "เพิ่มพนักงาน"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== Edit Modal ===== */}
            {editUser && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditUser(null)}>
                    <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900">แก้ไขข้อมูลพนักงาน</h2>
                            <button onClick={() => setEditUser(null)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        {/* Form */}
                        <div className="p-6 space-y-4">
                            {/* Row 1: Name + Email */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อ-นามสกุล</label>
                                    <input
                                        value={editUser.name}
                                        onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">อีเมล</label>
                                    <input
                                        value={editUser.email}
                                        disabled
                                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-500"
                                    />
                                </div>
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">เบอร์โทรศัพท์</label>
                                <input
                                    value={editUser.phone || ""}
                                    onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })}
                                    placeholder="089-XXX-XXXX"
                                    className={inputClass}
                                />
                            </div>

                            {/* Role + Position */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">สิทธิ์</label>
                                    <select
                                        value={editUser.role}
                                        onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                                        className={inputClass}
                                    >
                                        <option value="BOSS">ผู้บริหาร</option>
                                        <option value="DEVELOPER">นักพัฒนา</option>
                                        <option value="STAFF">พนักงาน</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">ตำแหน่ง</label>
                                    <input
                                        value={editUser.position || ""}
                                        onChange={(e) => setEditUser({ ...editUser, position: e.target.value })}
                                        placeholder="เช่น Content Creator, Editor"
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            {/* Bio */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">คำเกี่ยวกับ</label>
                                <textarea
                                    value={editUser.bio || ""}
                                    onChange={(e) => setEditUser({ ...editUser, bio: e.target.value })}
                                    placeholder="เล่าสั้นๆ เกี่ยวกับตัวเอง ดูแลรับผิดชอบอะไร"
                                    rows={3}
                                    className={`${inputClass} resize-none`}
                                />
                            </div>

                            {/* Skills */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">ทักษะ (คั่นด้วยเครื่องหมาย , )</label>
                                <input
                                    value={editUser.skills || ""}
                                    onChange={(e) => setEditUser({ ...editUser, skills: e.target.value })}
                                    placeholder="Management, Strategy, Creative Direction, Sales"
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
                            <button
                                onClick={() => setEditUser(null)}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                <X className="w-4 h-4" />
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="sv-btn-purple flex items-center gap-2 px-5 py-2.5 text-sm disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                {saving ? "กำลังบันทึก..." : "บันทึก"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
