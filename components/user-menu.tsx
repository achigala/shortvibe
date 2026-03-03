"use client"

import { signOut } from "next-auth/react"
import Link from "next/link"
import { LogOut, User } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"

interface UserMenuProps {
  userName: string
  userRole: string
  initials: string
}

export function UserMenu({ userName, userRole, initials }: UserMenuProps) {
  const roleLabel =
    userRole === "BOSS" ? "Boss" : userRole === "DEVELOPER" ? "Developer" : "Staff"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2.5 pl-4 border-l border-gray-200 outline-none">
          <div className="sv-avatar">{initials}</div>
          <div className="flex items-center gap-1 cursor-pointer group">
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
              {userName}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">{userName}</p>
            <p className="text-xs text-muted-foreground">{roleLabel}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/profile" className="cursor-pointer">
            <User className="w-4 h-4" />
            <span>ข้อมูลส่วนตัว</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          className="cursor-pointer"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="w-4 h-4" />
          <span>ออกจากระบบ</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
