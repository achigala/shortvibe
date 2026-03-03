import { NextRequest, NextResponse } from "next/server"
import { uploadToGoogleDrive } from "@/lib/google-drive"
import { auth } from "@/lib/auth"

export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const formData = await req.formData()
        const file = formData.get("file") as File
        const folderId = formData.get("folderId") as string

        if (!file || !folderId) {
            return NextResponse.json({ error: "File and folderId are required" }, { status: 400 })
        }

        const buffer = Buffer.from(await file.arrayBuffer())

        // Create a unique filename
        const ext = file.name.split('.').pop() || 'jpg'
        const fileName = `${session.user.id}_${Date.now()}.${ext}`

        // Upload to Google Drive
        const result = await uploadToGoogleDrive(buffer, fileName, file.type, folderId)

        // webViewLink is the viewable link, webContentLink is the download link
        // We'll return webViewLink as the URL to save in the database
        return NextResponse.json({ url: result.webViewLink, id: result.id })
    } catch (error) {
        console.error("Upload error:", error)
        return NextResponse.json({ error: "Failed to upload file to Google Drive" }, { status: 500 })
    }
}
