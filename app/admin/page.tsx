import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import Link from "next/link"
import { Users, Database, FolderKanban, UserCheck, Clock, Settings } from "lucide-react"

export default async function AdminPage() {
    const session = await auth()
    if (!session || (session.user.role !== "BOSS" && session.user.role !== "DEVELOPER")) {
        redirect("/dashboard")
    }

    const isBoss = session.user.role === "BOSS"

    let pendingUsersCount = 0
    let totalUsers = 0
    let totalProjects = 0
    let totalClients = 0
    let masterDataCount = 0

    try {
        const [pending, usersCount, projectsCount, clientsCount, masterCount] = await Promise.all([
            isBoss ? prisma.user.count({ where: { isApproved: false } }) : Promise.resolve(0),
            prisma.user.count({ where: { isApproved: true } }),
            prisma.project.count(),
            prisma.client.count(),
            prisma.masterData.count(),
        ])
        pendingUsersCount = pending
        totalUsers = usersCount
        totalProjects = projectsCount
        totalClients = clientsCount
        masterDataCount = masterCount
    } catch (e) {
        console.error("Admin stats error:", e)
    }

    const adminCards = [
        ...(isBoss ? [{
            title: "จัดการผู้ใช้งาน",
            description: "อนุมัติผู้ใช้ใหม่ ดูรายชื่อทีมงาน",
            href: "/admin/users",
            icon: Users,
            color: "from-blue-500 to-blue-600",
            stat: pendingUsersCount > 0 ? `${pendingUsersCount} รอการอนุมัติ` : `${totalUsers} คน`,
            badge: pendingUsersCount > 0 ? pendingUsersCount : null,
        }] : []),
        {
            title: "Master Data",
            description: "จัดการสถานะโปรเจค สถานะงาน และข้อมูลหลัก",
            href: "/admin/master",
            icon: Database,
            color: "from-purple-500 to-purple-600",
            stat: `${masterDataCount} รายการ`,
            badge: null,
        },
        {
            title: "ภาพรวมโปรเจค",
            description: "ดูข้อมูลโปรเจคทั้งหมดในระบบ",
            href: "/projects",
            icon: FolderKanban,
            color: "from-green-500 to-green-600",
            stat: `${totalProjects} โปรเจค`,
            badge: null,
        },
        {
            title: "ลูกค้า",
            description: "จัดการข้อมูลลูกค้าในระบบ",
            href: "/clients",
            icon: UserCheck,
            color: "from-orange-500 to-orange-600",
            stat: `${totalClients} ราย`,
            badge: null,
        },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Settings className="w-6 h-6 text-purple-500" /> ตั้งค่าระบบ
                </h1>
                <p className="text-gray-500 mt-1">จัดการข้อมูลและตั้งค่าระบบ Shortvibe</p>
            </div>

            {/* Admin Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {adminCards.map(card => (
                    <Link
                        key={card.href}
                        href={card.href}
                        className="bg-white rounded-2xl p-6 hover:shadow-lg transition-all duration-200 group border border-gray-100 hover:border-purple-200"
                    >
                        <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
                                <card.icon className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                                        {card.title}
                                    </h3>
                                    {card.badge && (
                                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                            {card.badge}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 mt-1">{card.description}</p>
                                <p className="text-sm font-medium text-purple-600 mt-2">{card.stat}</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}
