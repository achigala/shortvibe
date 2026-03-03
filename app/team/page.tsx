import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import TeamPageClient from "@/components/team-page-client"

export default async function TeamPage() {
    const session = await auth()
    if (!session) redirect("/login")

    const isBossOrDev = session.user.role === "BOSS" || session.user.role === "DEVELOPER"

    const users = await prisma.user.findMany({
        where: { isApproved: true },
        orderBy: [
            { role: "asc" },
            { createdAt: "asc" },
        ],
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            nickname: true,
            phone: true,
            position: true,
            bio: true,
            skills: true,
            themeColor: true,
            createdAt: true,
            isApproved: true,
        },
    })

    // Serialize dates for client component
    const serializedUsers = users.map(u => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
    }))

    return <TeamPageClient users={serializedUsers} isBossOrDev={isBossOrDev} />
}
