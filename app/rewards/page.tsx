import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { RewardsManagementClient } from "@/components/rewards-management-client"
import { MyRewardsClient } from "@/components/my-rewards-client"

// Disable all caching — rewards mutations must reflect immediately after refresh
export const dynamic = "force-dynamic"

export default async function RewardsPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const isBossOrDev = session.user.role === "BOSS" || session.user.role === "DEVELOPER"

  if (isBossOrDev) {
    const [rewards, users, pendingClaims, allClaims] = await Promise.all([
      prisma.reward.findMany({
        where: { isActive: true },
        include: {
          createdBy: true,
          assignments: {
            include: {
              user: true,
              claims: {
                include: {
                  claimedBy: true,
                  reviewedBy: true,
                },
                orderBy: { claimedAt: "desc" },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.findMany({
        where: { isApproved: true },
        orderBy: { name: "asc" },
      }),
      prisma.rewardClaim.findMany({
        where: { status: "PENDING", assignment: { reward: { isActive: true } } },
        include: {
          claimedBy: true,
          reviewedBy: true,
          assignment: {
            include: {
              reward: true,
            },
          },
        },
        orderBy: { claimedAt: "desc" },
      }),
      prisma.rewardClaim.findMany({
        where: { status: { not: "PENDING" }, assignment: { reward: { isActive: true } } },
        include: {
          claimedBy: true,
          reviewedBy: true,
          assignment: {
            include: {
              reward: true,
            },
          },
        },
        orderBy: { claimedAt: "desc" },
      }),
    ])

    const serializedRewards = rewards.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      amount: r.amount,
      frequency: r.frequency,
      isActive: r.isActive,
      createdAt: r.createdAt.toISOString(),
      createdBy: { name: r.createdBy.name },
      assignments: r.assignments.map((a) => ({
        id: a.id,
        userId: a.userId,
        isActive: a.isActive,
        assignedAt: a.assignedAt.toISOString(),
        user: { id: a.user.id, name: a.user.name, nickname: (a.user as any).nickname || null },
        claims: a.claims.map((c) => ({
          id: c.id,
          period: c.period,
          status: c.status,
          note: c.note,
          claimedAt: c.claimedAt.toISOString(),
          reviewedAt: c.reviewedAt?.toISOString() || null,
          claimedBy: { name: c.claimedBy.name },
          reviewedBy: c.reviewedBy ? { name: c.reviewedBy.name } : null,
        })),
      })),
    }))

    const serializedPendingClaims = pendingClaims.map((c) => ({
      id: c.id,
      period: c.period,
      status: c.status,
      note: c.note,
      claimedAt: c.claimedAt.toISOString(),
      reviewedAt: c.reviewedAt?.toISOString() || null,
      reviewedBy: c.reviewedBy ? { name: c.reviewedBy.name } : null,
      claimedBy: { name: c.claimedBy.name, nickname: (c.claimedBy as any).nickname || null },
      assignment: {
        reward: { name: c.assignment.reward.name, amount: c.assignment.reward.amount, frequency: c.assignment.reward.frequency },
      },
    }))

    const serializedAllClaims = allClaims.map((c) => ({
      id: c.id,
      period: c.period,
      status: c.status,
      note: c.note,
      claimedAt: c.claimedAt.toISOString(),
      reviewedAt: c.reviewedAt?.toISOString() || null,
      reviewNote: c.reviewNote,
      claimedBy: { name: c.claimedBy.name, nickname: (c.claimedBy as any).nickname || null },
      reviewedBy: c.reviewedBy ? { name: c.reviewedBy.name } : null,
      assignment: {
        reward: { name: c.assignment.reward.name, amount: c.assignment.reward.amount, frequency: c.assignment.reward.frequency },
      },
    }))

    return (
      <RewardsManagementClient
        rewards={serializedRewards}
        users={users.map((u) => ({ id: u.id, name: u.name, nickname: (u as any).nickname || null }))}
        pendingClaims={serializedPendingClaims}
        allClaims={serializedAllClaims}
      />
    )
  }

  // STAFF view
  const assignments = await prisma.rewardAssignment.findMany({
    where: { userId: session.user.id, isActive: true, reward: { isActive: true } },
    include: {
      reward: true,
      claims: {
        include: {
          reviewedBy: true,
        },
        orderBy: { claimedAt: "desc" },
      },
    },
    orderBy: { assignedAt: "desc" },
  })

  const serializedAssignments = assignments.map((a) => ({
    id: a.id,
    isActive: a.isActive,
    reward: {
      name: a.reward.name,
      description: a.reward.description,
      amount: a.reward.amount,
      frequency: a.reward.frequency,
    },
    claims: a.claims.map((c) => ({
      id: c.id,
      period: c.period,
      status: c.status,
      note: c.note,
      claimedAt: c.claimedAt.toISOString(),
      reviewedAt: c.reviewedAt?.toISOString() || null,
      reviewedBy: c.reviewedBy ? { name: c.reviewedBy.name } : null,
    })),
  }))

  return <MyRewardsClient assignments={serializedAssignments} />
}
