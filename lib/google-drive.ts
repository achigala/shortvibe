import { google } from "googleapis"
import { Readable } from "stream"

const SCOPES = ["https://www.googleapis.com/auth/drive.file"]

export async function uploadToGoogleDrive(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    folderId: string
) {
    // Authenticate using service account from env vars
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
    // Replace actual literal \n in the key if they exist
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n")

    if (!clientEmail || !privateKey) {
        throw new Error("Missing Google credentials in .env (GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY)")
    }

    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: clientEmail,
            private_key: privateKey,
        },
        scopes: SCOPES,
    })

    const drive = google.drive({ version: "v3", auth })

    // Convert buffer to stream
    const fileStream = new Readable()
    fileStream.push(fileBuffer)
    fileStream.push(null)

    const fileMetadata = {
        name: fileName,
        parents: [folderId],
    }

    const media = {
        mimeType: mimeType,
        body: fileStream,
    }

    try {
        const response = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: "id, webViewLink, webContentLink",
        })

        // Note: To allow anyone to view the file without signing in:
        if (response.data.id) {
            await drive.permissions.create({
                fileId: response.data.id,
                requestBody: {
                    role: "reader",
                    type: "anyone",
                },
            })
        }

        return response.data
    } catch (error) {
        console.error("Google Drive Upload Error:", error)
        throw error
    }
}
