/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        const videos = await prisma.video.findMany({
            orderBy: {
                createdAt: "desc"
            }
        });
        return NextResponse.json(videos)
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to fetch videos" },
            { status: 500 }
        );
    }
}