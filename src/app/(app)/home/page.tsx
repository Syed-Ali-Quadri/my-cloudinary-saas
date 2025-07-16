/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import VideoCard from "@/components/VideoCard";
import { Video } from "@/types/Video";
import React, { useCallback, useEffect, useState } from "react";

const HomePage = () => {
	const [videos, setVideos] = useState<Video[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchVideos = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const response = await fetch("/api/videos");

			if (!response.ok) {
				setError("Failed to fetch videos");
				throw new Error("Failed to fetch videos");
			}

			const data = await response.json();

			console.log("Fetched videos:", data);

			if (Array.isArray(data)) {
				setVideos(data);
			} else {
				setError("Invalid data format");
			}
		} catch (error) {
			console.error("Error fetching videos:", error);
			setError("An error occurred while fetching videos");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(
		() => {
			fetchVideos();
		},
		[fetchVideos]
	);

	const handleDownload = useCallback((url: string, title: string) => {
		const link = document.createElement("a");
		link.href = url;
		link.download = `${title}.mp4`;
		// link.setAttribute("download", `${title}.mp4`);
		// link.setAttribute("target", "_blank");
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}, []);

	if (loading) {
		return <div>Loading videos...</div>;
	}

	return (
		<div className="container mx-auto p-4">
			<h1 className="text-2xl font-bold mb-4">Videos</h1>
			{videos.length === 0
				? <div className="text-center text-lg text-gray-500">
						No videos available
					</div>
				: <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
						{videos.map(video =>
							<VideoCard
								key={video.id}
								video={video}
								onDownload={handleDownload}
							/>
						)}
					</div>}
		</div>
	);
};

export default HomePage;
