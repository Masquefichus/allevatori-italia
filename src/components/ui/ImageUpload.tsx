"use client";

import { useState, useRef } from "react";
import { Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  folder: string;
}

// Compress image using canvas
function compressImage(file: File, maxWidth = 1600, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas not supported")); return; }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Compression failed"));
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

export default function ImageUpload({
  images,
  onChange,
  maxImages = 6,
  folder,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError("");

    const supabase = createClient();
    if (!supabase) {
      setError("Supabase non configurato.");
      setUploading(false);
      return;
    }

    const storageKey = `sb-nveyyjefsrdyjdtwwxda-auth-token`;
    const stored = localStorage.getItem(storageKey);
    if (!stored) {
      setError("Devi effettuare il login.");
      setUploading(false);
      return;
    }

    try {
      const session = JSON.parse(stored);
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });

      const fileList = Array.from(files);
      const newImages: string[] = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];

        if (images.length + newImages.length >= maxImages) {
          setError(`Massimo ${maxImages} immagini.`);
          break;
        }

        // Validate
        if (!file.type.startsWith("image/")) {
          setError(`"${file.name}" non è un'immagine.`);
          continue;
        }

        if (file.size > 10 * 1024 * 1024) {
          setError(`"${file.name}" è troppo grande (max 10MB).`);
          continue;
        }

        setUploadProgress(`Caricamento ${i + 1}/${fileList.length}...`);

        try {
          // Compress image
          const compressed = await compressImage(file);
          const fileName = `${session.user.id}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

          const { error: uploadError } = await supabase.storage
            .from("Images")
            .upload(fileName, compressed, {
              contentType: "image/jpeg",
            });

          if (uploadError) {
            console.error("Upload error:", uploadError);
            setError(`Errore: ${uploadError.message}`);
            continue;
          }

          const { data: urlData } = supabase.storage
            .from("Images")
            .getPublicUrl(fileName);

          newImages.push(urlData.publicUrl);
        } catch (err) {
          console.error("File error:", err);
          setError(`Errore con "${file.name}". Riprova.`);
          continue;
        }
      }

      if (newImages.length > 0) {
        onChange([...images, ...newImages]);
        setError("");
      }
    } catch {
      setError("Errore durante il caricamento.");
    }

    setUploading(false);
    setUploadProgress("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function removeImage(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  function setAsCover(index: number) {
    if (index === 0) return;
    const newImages = [...images];
    const [moved] = newImages.splice(index, 1);
    newImages.unshift(moved);
    onChange(newImages);
  }

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {images.map((url, index) => (
            <div
              key={url}
              className="relative aspect-square rounded-lg overflow-hidden border border-border group"
            >
              <img
                src={url}
                alt={`Immagine ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="bg-red-500 text-white rounded-full p-1 cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              {index === 0 ? (
                <span className="absolute bottom-1 left-1 bg-primary text-white text-xs px-2 py-0.5 rounded">
                  Copertina
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setAsCover(index)}
                  className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-black/80"
                >
                  Imposta copertina
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {images.length < maxImages && (
        <label
          className={`flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:bg-muted transition-colors ${
            uploading ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            multiple
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
          {uploading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
              <span className="text-sm text-muted-foreground">{uploadProgress}</span>
            </div>
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">
                Clicca per caricare foto
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                JPG, PNG, WebP (max 10MB) · {images.length}/{maxImages}
              </span>
            </>
          )}
        </label>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
