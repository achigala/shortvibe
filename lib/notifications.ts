import prisma from "./prisma"

interface CreateNotificationParams {
  userId: string
  type: string
  title: string
  message: string
  link?: string
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    const result = await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link || null,
      },
    })
    console.log("[Notification] Created:", result.id, "for user:", params.userId, "type:", params.type)
    return result
  } catch (error: any) {
    console.error("[Notification] Failed to create:", error?.message || error)
    console.error("[Notification] Params:", JSON.stringify(params))
    // Don't throw - notification failure should not block the main operation
    return null
  }
}

export async function createNotificationForMany(
  userIds: string[],
  params: Omit<CreateNotificationParams, "userId">
) {
  if (!userIds || userIds.length === 0) {
    console.log("[Notification] No userIds provided, skipping")
    return
  }

  try {
    console.log("[Notification] Creating for users:", userIds, "type:", params.type)
    const result = await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link || null,
      })),
    })
    console.log("[Notification] Created", result.count, "notifications")
    return result
  } catch (error: any) {
    console.error("[Notification] Failed to create many:", error?.message || error)
    console.error("[Notification] UserIds:", userIds, "Params:", JSON.stringify(params))
    // Don't throw - notification failure should not block the main operation
    return null
  }
}
