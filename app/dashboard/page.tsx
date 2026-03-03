import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import Link from "next/link"
import {
  FolderKanban,
  Users,
  UserCheck,
  Receipt,
  TrendingUp,
  Clock,
  CheckCircle2,
  CalendarClock,
  ArrowUpRight,
  AlertCircle,
  Wallet,
  BarChart3,
  UserPlus
} from "lucide-react"

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const isBossOrDev = session.user.role === "BOSS" || session.user.role === "DEVELOPER"
  const userName = session.user.name?.split(" ")[0] || session.user.name

  // Query data
  const [
    clientCount,
    projectCount,
    activeProjectCount,
    teamCount,
    recentProjects,
    currentMonthRevenue,
    yearlyRevenue,
    monthlyClientCount,
  ] = await Promise.all([
    prisma.client.count(),
    prisma.project.count(),
    prisma.project.count({ where: { isCompleted: false } }),
    prisma.user.count({ where: { isApproved: true } }),
    prisma.project.findMany({
      include: { client: true, status: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    isBossOrDev
      ? prisma.revenue.aggregate({
        where: {
          date: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum: { amount: true },
      })
      : Promise.resolve({ _sum: { amount: null } }),
    isBossOrDev
      ? prisma.revenue.aggregate({
        where: {
          date: {
            gte: new Date(new Date().getFullYear(), 0, 1),
          },
        },
        _sum: { amount: true },
      })
      : Promise.resolve({ _sum: { amount: null } }),
    isBossOrDev
      ? prisma.client.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      })
      : Promise.resolve(0),
  ])

  // For staff: get assigned tasks
  const myTasks = !isBossOrDev
    ? await prisma.task.findMany({
      where: {
        assignees: { some: { userId: session.user.id } },
        isClosed: false,
      },
      include: {
        project: { include: { client: true, status: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 10,
    })
    : []

  // For boss: get pending tasks (overdue or with progress)
  const pendingProjects = isBossOrDev
    ? await prisma.project.findMany({
      where: { isCompleted: false },
      include: {
        client: true,
        owner: true,
        status: true,
        tasks: true,
      },
      orderBy: { endDate: "asc" },
      take: 5,
    })
    : []

  const monthlyRevenueAmt = currentMonthRevenue._sum.amount || 0
  const yearlyRevenueAmt = yearlyRevenue._sum.amount || 0

  const getStatusBadge = (statusName: string) => {
    if (statusName.includes("รอ")) return "sv-badge sv-badge-waiting"
    if (statusName.includes("กำลัง")) return "sv-badge sv-badge-inprogress"
    if (statusName.includes("ตรวจ")) return "sv-badge sv-badge-review"
    if (statusName.includes("เสร็จ")) return "sv-badge sv-badge-done"
    return "sv-badge sv-badge-waiting"
  }

  const getDaysRemaining = (endDate: Date | null) => {
    if (!endDate) return null
    const diff = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  // ===== STAFF VIEW =====
  if (!isBossOrDev) {
    const myProjectCount = myTasks.length
    const myTodoCount = myTasks.filter(t => t.progress < 100).length
    const myDoneCount = myTasks.filter(t => t.progress >= 100).length
    const nextDeadline = myTasks.find(t => t.dueDate)

    return (
      <div className="space-y-8">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">สวัสดี, {userName}! 👋</h1>
          <p className="text-gray-500 mt-1">นี่คืองานของคุณในวันนี้</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 sv-card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">งานของฉัน</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{myProjectCount}</p>
                <p className="text-xs text-gray-400 mt-1">โปรเจคที่รับผิดชอบ</p>
              </div>
              <div className="sv-icon-box sv-icon-blue"><FolderKanban className="w-5 h-5" /></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 sv-card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">งานที่ต้องทำ</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{myTodoCount}</p>
                <p className="text-xs text-gray-400 mt-1">ทันตามกำหนด</p>
              </div>
              <div className="sv-icon-box sv-icon-orange"><Clock className="w-5 h-5" /></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 sv-card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">งานที่เสร็จแล้ว</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{myDoneCount}</p>
                <p className="text-xs text-gray-400 mt-1">ในเดือนนี้</p>
              </div>
              <div className="sv-icon-box sv-icon-green"><CheckCircle2 className="w-5 h-5" /></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 sv-card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">กำหนดส่งต่อไป</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {nextDeadline?.dueDate ? getDaysRemaining(nextDeadline.dueDate) ?? 0 : 0}
                </p>
                <p className="text-xs text-gray-400 mt-1">ภายใน 7 วัน</p>
              </div>
              <div className="sv-icon-box sv-icon-purple"><CalendarClock className="w-5 h-5" /></div>
            </div>
          </div>
        </div>

        {/* My Tasks + Upcoming Deadlines */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* My Tasks */}
          <div className="lg:col-span-3 bg-white rounded-2xl p-6 sv-card-hover">
            <div className="flex items-center justify-between mb-5">
              <h2 className="sv-section-title">
                <FolderKanban className="w-5 h-5 text-blue-500" /> งานของฉัน
              </h2>
              <Link href="/projects" className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1">
                ดูทั้งหมด <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {myTasks.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">ไม่มีงานที่ต้องทำในขณะนี้ 🎉</p>
              )}
              {myTasks.map((task) => {
                const days = getDaysRemaining(task.dueDate)
                return (
                  <div key={task.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="sv-icon-box sv-icon-blue" style={{ width: 36, height: 36, borderRadius: 10 }}>
                        <FolderKanban className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{task.project.name}</p>
                        <p className="text-xs text-gray-400">{task.project.client.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={getStatusBadge(task.project.status.name)}>
                        {task.project.status.name}
                      </span>
                      {task.dueDate && (
                        <span className="text-xs text-gray-400">
                          {task.dueDate.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 sv-card-hover">
            <h2 className="sv-section-title mb-5">
              <AlertCircle className="w-5 h-5 text-red-500" /> กำหนดส่งใกล้เข้ามา
            </h2>
            <div className="space-y-4">
              {myTasks
                .filter(t => t.dueDate)
                .slice(0, 5)
                .map((task) => {
                  const days = getDaysRemaining(task.dueDate)
                  const isOverdue = days !== null && days < 0
                  return (
                    <div key={task.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">{task.project.name}</p>
                        <span className={`text-sm font-semibold ${isOverdue ? 'text-red-500' : days !== null && days <= 7 ? 'text-orange-500' : 'text-gray-500'}`}>
                          {isOverdue ? `${days} วัน` : `${days} วัน`}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{task.project.client.name}</p>
                    </div>
                  )
                })}
              {myTasks.filter(t => t.dueDate).length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">ไม่มีงานใกล้ deadline ✨</p>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ===== BOSS / DEV VIEW =====
  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">สวัสดี, {userName}! 👋</h1>
        <p className="text-gray-500 mt-1">นี่คือภาพรวมของ Shortvibe วันนี้</p>
      </div>

      {/* Summary Cards Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/projects" className="bg-white rounded-2xl p-5 sv-card-hover block no-underline">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">โปรเจกต์ทั้งหมด</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{projectCount}</p>
              <p className="text-xs text-gray-400 mt-1">{activeProjectCount} กำลังดำเนินการ</p>
            </div>
            <div className="sv-icon-box sv-icon-blue"><FolderKanban className="w-5 h-5" /></div>
          </div>
        </Link>
        <Link href="/clients" className="bg-white rounded-2xl p-5 sv-card-hover block no-underline">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">ลูกค้า</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{clientCount}</p>
            </div>
            <div className="sv-icon-box sv-icon-purple"><Users className="w-5 h-5" /></div>
          </div>
        </Link>
        <Link href="/team" className="bg-white rounded-2xl p-5 sv-card-hover block no-underline">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">ทีมงาน</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{teamCount}</p>
              <p className="text-xs text-gray-400 mt-1">คนทำงานอยู่</p>
            </div>
            <div className="sv-icon-box sv-icon-green"><UserCheck className="w-5 h-5" /></div>
          </div>
        </Link>
        <Link href="/revenue" className="bg-white rounded-2xl p-5 sv-card-hover block no-underline">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">รายได้เดือนนี้</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">฿{monthlyRevenueAmt.toLocaleString()}</p>
            </div>
            <div className="sv-icon-box sv-icon-pink"><Receipt className="w-5 h-5" /></div>
          </div>
        </Link>
      </div>

      {/* Highlight Cards Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/revenue" className="sv-highlight-green block no-underline">
          <p className="text-sm text-white/80 font-medium">รายได้เดือนนี้</p>
          <p className="text-3xl font-bold mt-2">฿{monthlyRevenueAmt.toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-2 text-sm text-white/70">
            <TrendingUp className="w-4 h-4" />
            <span>จากเดือนที่แล้ว</span>
          </div>
          <div className="absolute top-4 right-4 opacity-20">
            <Wallet className="w-12 h-12" />
          </div>
        </Link>
        <Link href="/revenue" className="sv-highlight-blue block no-underline">
          <p className="text-sm text-white/80 font-medium">รายได้ปีนี้</p>
          <p className="text-3xl font-bold mt-2">฿{yearlyRevenueAmt.toLocaleString()}</p>
          <p className="text-sm text-white/70 mt-2">{projectCount} โปรเจค</p>
          <div className="absolute top-4 right-4 opacity-20">
            <BarChart3 className="w-12 h-12" />
          </div>
        </Link>
        <Link href="/clients" className="sv-highlight-purple block no-underline">
          <p className="text-sm text-white/80 font-medium">ลูกค้าเดือนนี้</p>
          <p className="text-3xl font-bold mt-2">{monthlyClientCount} ราย</p>
          <p className="text-sm text-white/70 mt-2">{monthlyClientCount} โปรเจคใหม่</p>
          <div className="absolute top-4 right-4 opacity-20">
            <UserPlus className="w-12 h-12" />
          </div>
        </Link>
      </div>

      {/* Recent Projects + Pending Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Projects */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-6 sv-card-hover">
          <div className="flex items-center justify-between mb-5">
            <h2 className="sv-section-title">
              <FolderKanban className="w-5 h-5 text-blue-500" /> โปรเจคล่าสุด
            </h2>
            <Link href="/projects" className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1">
              ดูทั้งหมด <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-1">
            {recentProjects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="sv-icon-box sv-icon-blue" style={{ width: 36, height: 36, borderRadius: 10 }}>
                    <FolderKanban className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{project.name}</p>
                    <p className="text-xs text-gray-400">{project.client.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={getStatusBadge(project.status.name)}>
                    {project.status.name}
                  </span>
                  <span className="text-xs text-gray-400">
                    {project.createdAt.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              </Link>
            ))}
            {recentProjects.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">ยังไม่มีโปรเจค</p>
            )}
          </div>
        </div>

        {/* Pending Projects */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 sv-card-hover">
          <h2 className="sv-section-title mb-5">
            <AlertCircle className="w-5 h-5 text-orange-500" /> งานที่ค้างอยู่
            <span className="ml-2 text-sm font-normal bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
              {pendingProjects.length}
            </span>
          </h2>
          <div className="space-y-4">
            {pendingProjects.map((project) => {
              const progress = project.tasks.length > 0
                ? Math.round(project.tasks.reduce((sum, t) => sum + t.progress, 0) / project.tasks.length)
                : 0
              const days = getDaysRemaining(project.endDate)
              const isOverdue = days !== null && days < 0

              return (
                <Link key={project.id} href={`/projects/${project.id}`} className="block space-y-2 hover:bg-gray-50 rounded-lg p-2 -mx-2 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{project.name}</p>
                      <p className="text-xs text-gray-400">{project.client.name}</p>
                    </div>
                    <span className={getStatusBadge(project.status.name)}>
                      {project.status.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="sv-progress-bar flex-1">
                      <div className="sv-progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 font-medium w-10 text-right">{progress}%</span>
                  </div>
                  {days !== null && (
                    <div className="flex items-center justify-between">
                      {isOverdue ? (
                        <span className="text-xs text-red-500 font-medium">เลยกำหนด {Math.abs(days)} วัน</span>
                      ) : (
                        <span className="text-xs text-gray-400">เหลือ {days} วัน</span>
                      )}
                    </div>
                  )}
                </Link>
              )
            })}
            {pendingProjects.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">ไม่มีงานค้าง 🎉</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
