import React, { useState, useEffect, useCallback } from "react";
import { getCldImageUrl, getCldVideoUrl } from "next-cloudinary";
import { Download, Clock, FileDown, FileUp } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime"; // Fixed typo in import (realtiveTime -> relativeTime)
import { filesize } from "filesize";
import Image from "next/image";
import { Video } from "@/types/Video";

dayjs.extend(relativeTime);

interface VideoCardProps {
	video: Video;
	onDownload: (url: string, title: string) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onDownload }) => {
	const [isHovered, setIsHovered] = useState(false); // Removed React.useState for cleaner syntax
	const [isPreviewError, setIsPreviewError] = useState(false); // Removed React.useState for cleaner syntax

	const getThumbnailUrl = useCallback((publicId: string) => {
		return getCldImageUrl({
			src: publicId,
			width: 400,
			height: 225,
			crop: "fill",
			gravity: "auto",
			format: "jpg",
			// Generate thumbnail from video frame
			rawTransformations: ["so_0"] // Gets frame at 0 seconds
		});
	}, []);

	const getFullVideoUrl = useCallback((publicId: string) => {
		return getCldVideoUrl({
			src: publicId,
			width: 1920,
			height: 1080,
			quality: "auto",
			format: "mp4"
		});
	}, []);

	const getPreviewVideoUrl = useCallback((publicId: string) => {
		return getCldVideoUrl({
			src: publicId,
			width: 400,
			height: 225,
			rawTransformations: [
				"e_preview:duration_15:max_seg_9:min_seg_dur_1"
			]
		});
	}, []);

	const formatSize = useCallback((size: number) => {
		// Removed duplicate console.log for raw file size
		console.log("Format file size: ", filesize(size));
		return filesize(size, { standard: "jedec" }); // Added standard option for consistent formatting
	}, []);

	const formatDuration = useCallback((seconds: number) => {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = Math.round(seconds % 60);
		return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
	}, []);

	const compressionPercentage = Math.round(
		(1 - Number(video.compressedSize) / Number(video.originalSize)) * 100
	);

	useEffect(
		() => {
			setIsPreviewError(false); // Fixed function name (isPreviewError -> setIsPreviewError)
		},
		[isHovered]
	);

	const handlePreviewError = () => {
		setIsPreviewError(true);
	};

	return (
		<div
			className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300"
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			<figure className="aspect-video relative">
				{isHovered
					? isPreviewError
						? <div className="w-full h-full flex items-center justify-center bg-gray-200">
								<p className="text-red-500">
									Preview not available
								</p>
							</div>
						: <video
								src={getPreviewVideoUrl(video.publicId)}
								autoPlay
								muted
								loop
								className="w-full h-full object-cover"
								onError={handlePreviewError}
							/>
					: <Image
							src={getThumbnailUrl(video.publicId)}
							alt={video.title}
							width={400} // Added width prop for Next.js Image optimization
							height={225} // Added height prop for Next.js Image optimization
							className="w-full h-full object-cover"
						/>}
				<div className="absolute bottom-2 right-2 bg-base-100 bg-opacity-70 px-2 py-1 rounded-lg text-sm flex items-center">
					<Clock size={16} className="mr-1" />
					{formatDuration(video.duration)}
				</div>
			</figure>
			<div className="card-body p-4">
				<h2 className="card-title text-lg font-bold">
					{video.title}
				</h2>
				<p className="text-sm text-base-content opacity-70 mb-4">
					{video.description}
				</p>
				<p className="text-sm text-base-content opacity-70 mb-4">
					Uploaded {dayjs(video.createdAt).fromNow()}
				</p>
				<div className="grid grid-cols-2 gap-4 text-sm">
					<div className="flex items-center">
						<FileUp size={18} className="mr-2 text-primary" />
						<div>
							<div className="font-semibold">Original</div>
							<div>
								{formatSize(Number(video.originalSize))}
							</div>
						</div>
					</div>
					<div className="flex items-center">
						<FileDown size={18} className="mr-2 text-secondary" />
						<div>
							<div className="font-semibold">Compressed</div>
							<div>
								{formatSize(Number(video.compressedSize))}
							</div>
						</div>
					</div>
				</div>
				<div className="flex justify-between items-center mt-4">
					<div className="text-sm font-semibold">
						Compression:{" "}
						<span className="text-accent">
							{compressionPercentage}%
						</span>
					</div>
					<button
						className="btn btn-primary btn-sm"
						onClick={() =>
							onDownload(
								getFullVideoUrl(video.publicId),
								video.title
							)}
					>
						<Download size={16} />
					</button>
				</div>
			</div>
		</div>
	);
};

export default VideoCard;
