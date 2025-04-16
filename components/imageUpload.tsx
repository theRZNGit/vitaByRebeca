"use client";
import { useState } from "react";

interface ImageUploadProps {
  onUpload: (url: string) => void;
  currentImage?: string;
}

interface MultipleImagesUploadProps {
  onUpload: (urls: string[]) => void;
  currentImages?: string[];
  type?: "product" | "blog";
}

const ImageUpload = ({ onUpload, currentImage }: ImageUploadProps) => {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(currentImage || "");
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.[0]) return;

    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const endpoint = "/api/blog"; // 👈 Blog image uploads should go to /api/blog directly
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error(`Failed to upload image: ${response.status}`);
      const data = await response.json();
      if (data.url) {
        onUpload(data.url);
        setPreview(data.url);
        setFile(null);
      } else {
        alert("Error uploading file.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <div className="w-full h-40 border border-gray-300 rounded-md flex items-center justify-center relative cursor-pointer hover:border-blue-500 transition">
        {preview ? (
          <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-md" />
        ) : (
          <span className="text-gray-400">Drag and drop or click to upload</span>
        )}
        <input
          type="file"
          accept="image/*"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileChange}
          disabled={loading}
        />
      </div>
      {loading && <p className="text-gray-500 text-sm mt-2">Uploading...</p>}
      {file && !loading && (
        <button
          onClick={handleUpload}
          className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition w-full"
        >
          Confirmar imagen
        </button>
      )}
    </div>
  );
};

const MultipleImagesUpload = ({ onUpload, currentImages = [] }: MultipleImagesUploadProps) => {
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<(File | null)[]>(Array(6).fill(null));

  // Initialize previews with current images and fill the remaining slots with null
  const initialPreviews = [...currentImages, ...Array(6 - currentImages.length).fill(null)];
  const [previews, setPreviews] = useState<string[]>(initialPreviews);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    if (!event.target.files?.[0]) return;

    const file = event.target.files[0];
    const objectUrl = URL.createObjectURL(file);
    const updatedPreviews = [...previews];
    updatedPreviews[index] = objectUrl;

    const updatedFiles = [...files];
    updatedFiles[index] = file;

    setPreviews(updatedPreviews);
    setFiles(updatedFiles);
  };

  const handleUpload = async () => {
    if (files.every((file) => file === null)) return;
    setLoading(true);

    try {
      const uploadedUrls: string[] = [...currentImages];
      for (const file of files) {
        if (file) {
          const formData = new FormData();
          formData.append("file", file);

          const endpoint = "/api/products";
          const response = await fetch(endpoint, {
            method: "POST",
            body: formData,
          });

          if (!response.ok) throw new Error(`Failed to upload image: ${response.status}`);
          const data = await response.json();
          if (data.urls) uploadedUrls.push(...data.urls);
        }
      }

      onUpload(uploadedUrls);
      setFiles(Array(6).fill(null));
      alert("Imágenes subidas correctamente!");
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <div className="w-full h-64 border border-gray-300 rounded-md relative">
        <div className="grid grid-cols-3 grid-rows-2 gap-1 h-full">
          {previews.map((preview, index) => (
            <div
              key={index}
              className="relative w-full h-full border border-gray-300 rounded-md flex items-center justify-center"
            >
              {preview ? (
                <img src={preview} alt={`Image ${index + 1}`} className="w-full h-full object-cover rounded-md" />
              ) : (
                <span className="text-gray-400">+</span>
              )}
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => handleFileChange(e, index)}
                disabled={loading}
              />
            </div>
          ))}
        </div>
        {loading && <p className="text-gray-500 text-sm mt-2">Uploading...</p>}
      </div>
      {files.some((file) => file !== null) && !loading && (
        <button
          onClick={handleUpload}
          className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition w-full"
        >
          Confirmar imágenes
        </button>
      )}
    </div>
  );
};

export { ImageUpload, MultipleImagesUpload };
