"use client";

import { useEffect, useState, useRef } from "react";
import { CldImage } from "next-cloudinary";

// Define social media formats with explicit types
interface SocialFormat {
  width: number;
  height: number;
  aspectRatio: string;
}

const socialFormats: Record<string, SocialFormat> = {
  "Instagram Square (1:1)": {
    width: 1080,
    height: 1080,
    aspectRatio: "1:1",
  },
  "Instagram Portrait (4:5)": {
    width: 1080,
    height: 1350,
    aspectRatio: "4:5",
  },
  "Twitter Post (16:9)": {
    width: 1200,
    height: 675,
    aspectRatio: "16:9",
  },
  "Twitter Header (3:1)": {
    width: 1500,
    height: 500,
    aspectRatio: "3:1",
  },
  "Facebook Cover (205:78)": {
    width: 820,
    height: 312,
    aspectRatio: "205:78",
  },
};

const SocialShare = () => {
  const [selectedFormat, setSelectedFormat] = useState<keyof typeof socialFormats>("Instagram Square (1:1)");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  // Handle transformation state when format changes
  useEffect(() => {
    if (uploadedImage) {
      setIsTransforming(true);
    }
  }, [selectedFormat, uploadedImage]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.warn("No file selected");
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/image-upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload image");
      }

      const data = await response.json();
      setUploadedImage(data.result.public_id);
      alert("Image uploaded successfully!");
    } catch (error) {
      console.error("Error uploading file:", error);
      alert(`Error uploading file: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = () => {
      console.log("Download button clicked");
      console.log("Image reference:", imageRef.current);
      if(!imageRef.current) return;

      console.log("Image source URL:", imageRef.current.src);
      fetch(imageRef.current.src)
        .then(response => response.blob())
        .then(blob => {
          console.log("Blob:", blob);
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");

          link.href = url;
          link.download = `social-share-${selectedFormat}.png`;

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        })
    }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Social Media Image Creator
      </h1>

      <div className="card">
        <div className="card-body">
          <h2 className="card-title mb-4">Upload an Image</h2>
          <div className="form-control">
            <label className="label" htmlFor="image-upload">
              <span className="label-text">Choose an image file</span>
            </label>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="file-input file-input-bordered file-input-primary w-full"
              aria-label="Upload an image file"
            />
          </div>

          {isUploading && (
            <div className="mt-4">
              <progress
                className="progress progress-primary w-full"
                aria-label="Uploading image"
              ></progress>
            </div>
          )}

          {uploadedImage && (
            <div className="mt-6">
              <h2 className="card-title mb-4">Select Social Media Format</h2>
              <div className="form-control">
                <label className="label" htmlFor="format-select">
                  <span className="label-text">Social media format</span>
                </label>
                <select
                  id="format-select"
                  className="select select-bordered w-full bg-black text-white"
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value as keyof typeof socialFormats)}
                  aria-label="Select social media format"
                >
                  {Object.keys(socialFormats).map((format) => (
                    <option key={format} value={format}>
                      {format}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-6 relative">
                <h3 className="text-lg font-semibold mb-2">Preview:</h3>
                <div className="flex justify-center">
                  {isTransforming && (
                    <div className="absolute inset-0 flex items-center justify-center bg-base-100 bg-opacity-50 z-10">
                      <span
                        className="loading loading-spinner loading-lg"
                        aria-label="Transforming image"
                      ></span>
                    </div>
                  )}
                  <CldImage
                    width={socialFormats[selectedFormat].width}
                    height={socialFormats[selectedFormat].height}
                    src={uploadedImage}
                    sizes="100vw"
                    alt="Transformed social media image"
                    crop="fill"
                    aspectRatio={socialFormats[selectedFormat].aspectRatio}
                    gravity="auto"
                    ref={imageRef}
                    onLoad={() => setIsTransforming(false)}
                  />
                </div>
              </div>

              <div className="card-actions justify-end mt-6">
                <button
                  className="btn btn-primary"
                  onClick={handleDownload}
                  aria-label={`Download image for ${selectedFormat}`}
                >
                  Download for {selectedFormat}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SocialShare;