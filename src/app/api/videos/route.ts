import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        // Fetch all videos from the database
        // and return them in descending order by creation date
        const videos = await prisma.video.findMany({
            orderBy: {
                createdAt: "desc"
            }
        });
        return NextResponse.json(videos)
    } catch (error) {
        console.log("Error fetching videos:", error);
        return NextResponse.json(
            { error: "Failed to fetch videos" },
            { status: 500 }
        );
    }
}