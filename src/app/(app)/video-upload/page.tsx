/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";

const videoUpload = () => {
	const [file, setFile] = useState<File | null>(null);
	const [title, setTitle] = useState<string>("");
	const [description, setDescription] = useState<string>("");
	const [isUploading, setIsUploading] = useState<boolean>(false);

	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!file || !title || !description) {
			alert("Please fill in all fields and select a file.");
			return;
		}

		setIsUploading(true);

		const formData = new FormData();
		formData.append("file", file);
		formData.append("title", title);
		formData.append("description", description);
		formData.append("originalSize", file.size.toString());

		try {
			const response = await fetch("/api/video-upload", {
				method: "POST",
				body: formData
			});

			if (!response.ok) {
				throw new Error("Failed to upload video");
			}

			const data = await response.json();
			console.log("Upload successful:", data);
			router.push("/");
		} catch (error) {
			console.error("Error uploading video:", error);
			alert("Error uploading video. Please try again.");
		} finally {
			setIsUploading(false);
		}
	};

	return (
		<div className="container mx-auto p-4">
			<h1 className="text-2xl font-bold mb-4">Upload Video</h1>
			<form onSubmit={handleSubmit} className="space-y-4">
				<div>
					<label className="label">
						<span className="label-text">Title</span>
					</label>
					<input
						type="text"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						className="input input-bordered w-full text-white rounded-sm border-2 border-gray-300"
						required
					/>
				</div>
				<div>
					<label className="label">
						<span className="label-text">Description</span>
					</label>
					<textarea
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						className="textarea textarea-bordered w-full text-white rounded-sm border-2 border-gray-300"
					/>
				</div>
				<div>
					<label className="label">
						<span className="label-text">Video File</span>
					</label>
					<input
						type="file"
						accept="video/*"
						onChange={(e) => setFile(e.target.files?.[0] || null)}
						className="file-input file-input-bordered w-full"
						required
					/>
				</div>
				<button
					type="submit"
					className="btn btn-primary"
					disabled={isUploading}
				>
					{isUploading ? "Uploading..." : "Upload Video"}
				</button>
			</form>
		</div>
	);
};

export default videoUpload;
