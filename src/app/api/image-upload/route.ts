import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { auth } from "@clerk/nextjs/server";

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
	[key: string]: unknown; // Allow additional fields from Cloudinary
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

		// Validate file
		if (!file) {
			return NextResponse.json(
				{ error: "No file provided" },
				{ status: 400 }
			);
		}

		// Validate file type (only images)
		const allowedTypes = [
			"image/jpeg",
			"image/png",
			"image/gif",
			"image/webp"
		];
		if (!allowedTypes.includes(file.type)) {
			return NextResponse.json(
				{
					error: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed."
				},
				{ status: 400 }
			);
		}

		// Validate file size (e.g., max 10MB)
		const maxSize = 10 * 1024 * 1024; // 10MB in bytes
		if (file.size > maxSize) {
			return NextResponse.json(
				{ error: "File size exceeds 10MB limit." },
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
						folder: `cloudinary-saas/image/`, // Sanitize userId
						resource_type: "image"
					},
					(error, result) => {
						if (error || !result) {
							reject(
								error || new Error("Cloudinary upload failed")
							);
						} else {
							resolve(result);
						}
					}
				);

				uploadStream.end(buffer);
			}
		);

		// Return only necessary data
		return NextResponse.json(
			{
				public_id: result.public_id,
				url: result.secure_url
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error("Error uploading image to Cloudinary:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Failed to upload image";
		return NextResponse.json({ error: errorMessage }, { status: 500 });
	}
}
