"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { LucideIcon } from "lucide-react"

interface NavItem {
  name: string
  href: string
}

interface Props {
  items: (NavItem & { iconName: string })[]
}

import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Calendar,
  Receipt,
  Settings,
  UserCircle,
  Gift,
} from "lucide-react"

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  FolderKanban,
  Calendar,
  Receipt,
  Settings,
  UserCircle,
  Gift,
}

export function NavLinks({ items }: Props) {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-1">
      {items.map((item) => {
        const Icon = ICONS[item.iconName]
        // Active when pathname matches exactly OR starts with href + "/"
        // Special-case "/dashboard" so it doesn't match "/dashboard/profile" only-active for exact
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"))
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`sv-nav-link${isActive ? " active" : ""}`}
          >
            {Icon && <Icon className="w-4 h-4" />}
            {item.name}
          </Link>
        )
      })}
    </nav>
  )
}
