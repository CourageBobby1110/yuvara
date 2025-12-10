"use client";

import { CldUploadWidget } from "next-cloudinary";
import { Upload, X, Film } from "lucide-react";
import { useState } from "react";

interface CloudinaryVideoUploadProps {
  onUpload: (url: string) => void;
  disabled?: boolean;
}

export default function CloudinaryVideoUpload({
  onUpload,
  disabled,
}: CloudinaryVideoUploadProps) {
  const [error, setError] = useState("");

  return (
    <div className="w-full">
      <CldUploadWidget
        uploadPreset={
          process.env.NEXT_PUBLIC_CLOUDINARY_PRESET || "yuvara_preset"
        }
        options={{
          maxFiles: 1,
          resourceType: "video",
          clientAllowedFormats: ["mp4", "mov", "webm"],
          maxFileSize: 100000000, // 100MB
          sources: ["local", "url", "google_drive"],
          styles: {
            palette: {
              window: "#FFFFFF",
              windowBorder: "#90A0B3",
              tabIcon: "#0078FF",
              menuIcons: "#5A616A",
              textDark: "#000000",
              textLight: "#FFFFFF",
              link: "#0078FF",
              action: "#FF620C",
              inactiveTabIcon: "#0E2F5A",
              error: "#F44235",
              inProgress: "#0078FF",
              complete: "#20B832",
              sourceBg: "#E4EBF1",
            },
          },
        }}
        onSuccess={(result: any) => {
          if (result.info?.secure_url) {
            onUpload(result.info.secure_url);
          }
        }}
        onError={(err) => {
          console.error("Cloudinary Error:", err);
          setError("Upload failed. Please try again.");
        }}
      >
        {({ open }) => {
          return (
            <div
              onClick={() => !disabled && open()}
              className={`
                border-2 border-dashed border-gray-300 rounded-xl p-8
                flex flex-col items-center justify-center gap-4
                cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all
                ${disabled ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                <Film className="w-6 h-6" />
              </div>
              <div className="text-center">
                <p className="font-medium text-gray-900">
                  Click to upload video
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  MP4, MOV, WEBM (Max 100MB)
                </p>
              </div>
            </div>
          );
        }}
      </CldUploadWidget>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}
