"use client"

import { useState } from "react"
import { Save, User, Mail, Phone, MapPin, Calendar, Briefcase, Heart, Palette } from "lucide-react"

interface UserProfile {
    id: string
    name: string
    email: string
    role: string
    nickname: string | null
    firstName: string | null
    lastName: string | null
    displayName: string | null
    phone: string | null
    position: string | null
    bio: string | null
    skills: string | null
    gender: string | null
    birthday: string | null
    address: string | null
    idCardImageUrl: string | null
    fatherName: string | null
    motherName: string | null
    salaryAccountNo: string | null
    maritalStatus: string | null
    themeColor: string | null
    avatar: string | null
    createdAt: string
}

const roleLabels: Record<string, string> = {
    BOSS: "ผู้บริหาร",
    DEVELOPER: "นักพัฒนา",
    STAFF: "พนักงาน",
}

const roleColors: Record<string, string> = {
    BOSS: "bg-purple-100 text-purple-700",
    DEVELOPER: "bg-blue-100 text-blue-700",
    STAFF: "bg-green-100 text-green-700",
}

const themeOptions = [
    { value: "purple", label: "ม่วง", gradient: "from-purple-500 to-purple-600" },
    { value: "blue", label: "น้ำเงิน", gradient: "from-blue-500 to-blue-600" },
    { value: "pink", label: "ชมพู", gradient: "from-pink-500 to-pink-600" },
    { value: "green", label: "เขียว", gradient: "from-green-500 to-green-600" },
    { value: "orange", label: "ส้ม", gradient: "from-orange-500 to-orange-600" },
    { value: "dark", label: "ดำ", gradient: "from-gray-800 to-gray-900" },
]

const inputClass = "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"

export function ProfileClient({ user: initialUser }: { user: UserProfile }) {
    const [form, setForm] = useState(initialUser)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState("")
    const [uploadingAvatar, setUploadingAvatar] = useState(false)
    const [uploadingIdCard, setUploadingIdCard] = useState(false)

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "avatar" | "idCardImageUrl") => {
        const file = e.target.files?.[0]
        if (!file) return

        if (field === "avatar") setUploadingAvatar(true)
        else setUploadingIdCard(true)

        try {
            const formData = new FormData()
            formData.append("file", file)
            formData.append("folderId", "1R50-b6pa-5CXNUdXfAjmYDPkiXkNeFMe")

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            })

            if (res.ok) {
                const data = await res.json()
                setForm({ ...form, [field]: data.url })
                setMessage("อัปโหลดสำเร็จ")
                setTimeout(() => setMessage(""), 3000)
            } else {
                setMessage("อัปโหลดล้มเหลว")
            }
        } catch (error) {
            setMessage("เกิดข้อผิดพลาดในการอัปโหลด")
        } finally {
            if (field === "avatar") setUploadingAvatar(false)
            else setUploadingIdCard(false)
            // Reset input so we can select same file again
            e.target.value = ""
        }
    }

    const gradient = themeOptions.find(t => t.value === (form.themeColor || "purple"))?.gradient || "from-purple-500 to-purple-600"
    const initial = form.nickname?.charAt(0) || form.name.charAt(0)

    const handleSave = async () => {
        setSaving(true)
        setMessage("")
        try {
            const res = await fetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            })
            if (res.ok) {
                setMessage("บันทึกสำเร็จ")
                setTimeout(() => setMessage(""), 3000)
            } else {
                setMessage("เกิดข้อผิดพลาด")
            }
        } catch {
            setMessage("เกิดข้อผิดพลาด")
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">ข้อมูลส่วนตัว</h1>
                <p className="text-gray-500 mt-1">ดูและแก้ไขข้อมูลโปรไฟล์ของคุณ</p>
            </div>

            {/* Avatar Section */}
            <div className="bg-white rounded-2xl p-6 sv-card-hover">
                <div className="flex items-center gap-5">
                    <div className="relative group">
                        <button
                            type="button"
                            onClick={() => document.getElementById("avatar-upload")?.click()}
                            className={`w-20 h-20 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-3xl font-bold flex-shrink-0 overflow-hidden bg-cover bg-center cursor-pointer relative`}
                            style={form.avatar ? { backgroundImage: `url(${form.avatar})` } : {}}
                            disabled={uploadingAvatar}
                            title="เปลี่ยนรูปโปรไฟล์"
                        >
                            {!form.avatar && initial}
                            <div className={`absolute inset-0 bg-black/40 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity ${uploadingAvatar ? 'opacity-100' : ''}`}>
                                {uploadingAvatar ? "กำลังอัปโหลด..." : "เปลี่ยนรูป"}
                            </div>
                        </button>
                        <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, "avatar")} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{form.name}</h2>
                        <p className="text-sm text-gray-500">{form.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${roleColors[form.role] || roleColors.STAFF}`}>
                                {roleLabels[form.role] || form.role}
                            </span>
                            {form.position && <span className="text-xs text-gray-400">{form.position}</span>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="bg-white rounded-2xl p-6 sv-card-hover space-y-5">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-purple-500" /> ข้อมูลทั่วไป
                </h3>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อจริง</label>
                        <input value={form.firstName || ""} onChange={e => setForm({ ...form, firstName: e.target.value })} className={inputClass} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">นามสกุล</label>
                        <input value={form.lastName || ""} onChange={e => setForm({ ...form, lastName: e.target.value })} className={inputClass} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อที่อยากให้แสดง (Display Name)</label>
                        <input value={form.displayName || ""} onChange={e => setForm({ ...form, displayName: e.target.value })} className={inputClass} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อเล่น</label>
                        <input value={form.nickname || ""} onChange={e => setForm({ ...form, nickname: e.target.value })} placeholder="ชื่อเล่น" className={inputClass} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            <Mail className="w-3.5 h-3.5 inline mr-1" />อีเมล
                        </label>
                        <input value={form.email} disabled className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            <Phone className="w-3.5 h-3.5 inline mr-1" />เบอร์โทรศัพท์
                        </label>
                        <input value={form.phone || ""} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="089-XXX-XXXX" className={inputClass} />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        <Briefcase className="w-3.5 h-3.5 inline mr-1" />ตำแหน่ง
                    </label>
                    <input value={form.position || ""} onChange={e => setForm({ ...form, position: e.target.value })} placeholder="เช่น Content Creator" className={inputClass} />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">เกี่ยวกับฉัน</label>
                    <textarea value={form.bio || ""} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="เล่าสั้น ๆ เกี่ยวกับตัวเอง" rows={3} className={`${inputClass} resize-none`} />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">ทักษะ (คั่นด้วย , )</label>
                    <input value={form.skills || ""} onChange={e => setForm({ ...form, skills: e.target.value })} placeholder="Management, Strategy, Creative Direction" className={inputClass} />
                </div>
            </div>

            {/* Personal Info */}
            <div className="bg-white rounded-2xl p-6 sv-card-hover space-y-5">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-pink-500" /> ข้อมูลส่วนบุคคล
                </h3>

                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">เพศ</label>
                        <select value={form.gender || ""} onChange={e => setForm({ ...form, gender: e.target.value })} className={inputClass}>
                            <option value="">เลือก</option>
                            <option value="ชาย">ชาย</option>
                            <option value="หญิง">หญิง</option>
                            <option value="LGBTQ">LGBTQ</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            <Calendar className="w-3.5 h-3.5 inline mr-1" />วันเกิด
                        </label>
                        <input type="date" value={form.birthday ? form.birthday.split("T")[0] : ""} onChange={e => setForm({ ...form, birthday: e.target.value })} className={inputClass} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">สถานะ</label>
                        <select value={form.maritalStatus || ""} onChange={e => setForm({ ...form, maritalStatus: e.target.value })} className={inputClass}>
                            <option value="">เลือก</option>
                            <option value="โสด">โสด</option>
                            <option value="สมรส">สมรส</option>
                            <option value="สมรส มีบุตร">สมรส มีบุตร</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        <MapPin className="w-3.5 h-3.5 inline mr-1" />ที่อยู่
                    </label>
                    <textarea value={form.address || ""} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="ที่อยู่" rows={2} className={`${inputClass} resize-none`} />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อบิดา</label>
                        <input value={form.fatherName || ""} onChange={e => setForm({ ...form, fatherName: e.target.value })} className={inputClass} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อมารดา</label>
                        <input value={form.motherName || ""} onChange={e => setForm({ ...form, motherName: e.target.value })} className={inputClass} />
                    </div>
                </div>

                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">เลขที่บัญชีธนาคาร (รับเงินเดือน)</label>
                    <input value={form.salaryAccountNo || ""} onChange={e => setForm({ ...form, salaryAccountNo: e.target.value })} className={inputClass} />
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                    <label className="block text-sm font-medium text-gray-700 mb-2">สำเนาบัตรประชาชน</label>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <button
                            type="button"
                            onClick={() => document.getElementById("idcard-upload")?.click()}
                            disabled={uploadingIdCard}
                            className="px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors disabled:opacity-50"
                        >
                            {uploadingIdCard ? "กำลังอัปโหลด..." : "อัปโหลดรููปบัตรประชาชน"}
                        </button>
                        <input id="idcard-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, "idCardImageUrl")} />

                        {form.idCardImageUrl && (
                            <a href={form.idCardImageUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-purple-600 hover:text-purple-700 hover:underline">
                                ดูไฟล์ที่แนบไว้ปัจจุบัน
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {/* Theme Color */}
            <div className="bg-white rounded-2xl p-6 sv-card-hover space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-orange-500" /> สีธีม
                </h3>
                <div className="flex items-center gap-3">
                    {themeOptions.map(t => (
                        <button
                            key={t.value}
                            onClick={() => setForm({ ...form, themeColor: t.value })}
                            className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.gradient} transition-all ${form.themeColor === t.value ? "ring-4 ring-offset-2 ring-purple-300 scale-110" : "hover:scale-105"}`}
                            title={t.label}
                        />
                    ))}
                </div>
            </div>

            {/* Save */}
            <div className="flex items-center justify-between">
                {message && (
                    <span className={`text-sm font-medium ${message.includes("สำเร็จ") ? "text-green-600" : "text-red-500"}`}>
                        {message}
                    </span>
                )}
                <div className="ml-auto">
                    <button onClick={handleSave} disabled={saving} className="sv-btn-purple flex items-center gap-2 px-6 py-2.5 text-sm disabled:opacity-50">
                        <Save className="w-4 h-4" />
                        {saving ? "กำลังบันทึก..." : "บันทึก"}
                    </button>
                </div>
            </div>
        </div>
    )
}
