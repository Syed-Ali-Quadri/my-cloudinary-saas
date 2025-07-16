import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@/generated/prisma";

// Initialize Prisma Client
const prisma = new PrismaClient();

// Configure Cloudinary
cloudinary.config({
	cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET
});

// Define expected Cloudinary upload response type
interface CloudinaryUploadResult {
	public_id: string;
	secure_url: string;
	duration: number;
	bytes: number;
	[key: string]: unknown; // Allow additional fields
}

// Define expected Prisma video schema
interface VideoData {
	title: string;
	description: string;
	publicId: string;
	duration: number;
	originalSize: number;
	compressedSize: number;
}

export async function POST(request: NextRequest) {
	// Authenticate user
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const formData = await request.formData();
		const file = formData.get("file") as File;
		const title = formData.get("title") as string | null;
		const description = formData.get("description") as string | null;
		const duration = formData.get("duration") as string | null;
		const originalSize = formData.get("originalSize") as string | null;

		// Validate file
		if (!file) {
			return NextResponse.json(
				{ error: "No file provided" },
				{ status: 400 }
			);
		}

		// Validate required fields
		if (!title || !description || !duration || !originalSize) {
			return NextResponse.json(
				{
					error: "Missing required fields: title, description, duration, or originalSize"
				},
				{ status: 400 }
			);
		}

		// Validate file type (only videos)
		const allowedTypes = ["video/mp4", "video/webm", "video/ogg"];
		if (!allowedTypes.includes(file.type)) {
			return NextResponse.json(
				{
					error: "Invalid file type. Only MP4, WebM, and OGG are allowed."
				},
				{ status: 400 }
			);
		}

		// Validate file size (e.g., max 100MB)
		const maxSize = 100 * 1024 * 1024; // 100MB in bytes
		if (file.size > maxSize) {
			return NextResponse.json(
				{ error: "File size exceeds 100MB limit." },
				{ status: 400 }
			);
		}

		// Parse duration and originalSize
		const parsedDuration = parseFloat(duration);
		const parsedOriginalSize = parseInt(originalSize, 10);
		if (isNaN(parsedDuration) || isNaN(parsedOriginalSize)) {
			return NextResponse.json(
				{ error: "Invalid duration or originalSize format." },
				{ status: 400 }
			);
		}

		// Convert file to buffer
		const bytes = await file.arrayBuffer();
		const buffer = Buffer.from(bytes);

		// Upload to Cloudinary
		const result = await new Promise<CloudinaryUploadResult>(
			(resolve, reject) => {
				const uploadStream = cloudinary.uploader.upload_stream(
					{
						resource_type: "video",
						folder: `cloudinary-saas/video/${userId.replace(
							/[^a-zA-Z0-9_-]/g,
							""
						)}`, // Sanitize userId
						transformation: [
							{ quality: "auto", fetch_format: "mp4" }
						]
					},
					(error, result) => {
						if (error || !result) {
							reject(
								error || new Error("Cloudinary upload failed")
							);
						} else {
							resolve(result as CloudinaryUploadResult);
						}
					}
				);

				uploadStream.end(buffer);
			}
		);

		// Save metadata to the database
		const video = await prisma.video.create<VideoData>({
			data: {
				title,
				description,
				publicId: result.public_id,
				duration: result.duration, // Cloudinary duration (number)
				originalSize: parsedOriginalSize,
				compressedSize: result.bytes
			}
		});

		// Return only necessary data
		return NextResponse.json(
			{
				public_id: result.public_id,
				url: result.secure_url,
				video: {
					id: video.id,
					title: video.title,
					description: video.description,
					publicId: video.publicId,
					duration: video.duration,
					originalSize: video.originalSize,
					compressedSize: video.compressedSize
				}
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error(
			"Error uploading video to Cloudinary or saving to database:",
			error
		);
		const errorMessage =
			error instanceof Error ? error.message : "Failed to upload video";
		return NextResponse.json({ error: errorMessage }, { status: 500 });
	} finally {
		// Disconnect Prisma to prevent connection leaks
		await prisma.$disconnect();
	}
}
