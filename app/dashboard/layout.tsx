import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import Link from "next/link"
import { Video } from "lucide-react"
import { UserMenu } from "@/components/user-menu"
import { NotificationBell } from "@/components/notification-bell"
import { NavLinks } from "@/components/nav-links"
import { serverCache, CacheKeys, CacheTTL } from "@/lib/cache"

const bossNavigation = [
  { name: "แดชบอร์ด", href: "/dashboard", iconName: "LayoutDashboard" },
  { name: "ทีมงาน", href: "/team", iconName: "Users" },
  { name: "ลูกค้า", href: "/clients", iconName: "UserCircle" },
  { name: "โปรเจค", href: "/projects", iconName: "FolderKanban" },
  { name: "ปฏิทิน", href: "/calendar", iconName: "Calendar" },
  { name: "รายงานรายได้", href: "/revenue", iconName: "Receipt" },
  { name: "สวัสดิการ", href: "/rewards", iconName: "Gift" },
  { name: "ตั้งค่า", href: "/admin", iconName: "Settings" },
]

const staffNavigation = [
  { name: "แดชบอร์ด", href: "/dashboard", iconName: "LayoutDashboard" },
  { name: "โปรเจค", href: "/projects", iconName: "FolderKanban" },
  { name: "ปฏิทิน", href: "/calendar", iconName: "Calendar" },
  { name: "สวัสดิการ", href: "/rewards", iconName: "Gift" },
]

// Theme color map - defined once at module level
const themeColors: Record<string, { main: string; light: string }> = {
  purple: { main: "#9333ea", light: "#c084fc" },
  blue: { main: "#3b82f6", light: "#60a5fa" },
  pink: { main: "#ec4899", light: "#f472b6" },
  green: { main: "#10b981", light: "#34d399" },
  orange: { main: "#f97316", light: "#fb923c" },
  dark: { main: "#1f2937", light: "#4b5563" },
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const isBossOrDev = session.user.role === "BOSS" || session.user.role === "DEVELOPER"
  const navigation = isBossOrDev ? bossNavigation : staffNavigation
  const initials = session.user.name?.charAt(0) || "U"

  // Cache user theme - theme rarely changes, cache for 1 hour
  let themeStyle = {}
  try {
    const userTheme = await serverCache.getOrSet(
      CacheKeys.userTheme(session.user.id),
      async () => {
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { themeColor: true }
        })
        return user?.themeColor || null
      },
      CacheTTL.THEME
    )

    if (userTheme) {
      const theme = themeColors[userTheme]
      if (theme) {
        themeStyle = {
          "--sv-purple": theme.main,
          "--sv-purple-light": theme.light,
        } as React.CSSProperties
      }
    }
  } catch (e) {
    // Ignore db fetch error
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb]" style={themeStyle}>
      {/* Top Navbar */}
      <header className="sv-navbar">
        <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 mr-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-sm">
              <Video className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
              Shortvibe
            </span>
          </Link>

          {/* Navigation Links */}
          <NavLinks items={navigation} />

          {/* Right side: Notification + User */}
          <div className="flex items-center gap-4 ml-8">
            {/* Notification Bell */}
            <NotificationBell />

            {/* User Avatar + Name + Dropdown */}
            <UserMenu
              userName={session.user.name || "User"}
              userRole={session.user.role || "STAFF"}
              initials={initials}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
