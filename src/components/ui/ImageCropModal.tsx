"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { ChevronDown, Check } from "lucide-react";

interface Props {
  src: string;
  onCrop: (croppedFile: File) => void;
  onClose: () => void;
}

const ASPECT_OPTIONS = [
  { label: "Libero", value: undefined, circle: false },
  { label: "Cerchio", value: 1, circle: true },
  { label: "Quadrato", value: 1 },
  { label: "5:4", value: 5 / 4 },
  { label: "4:3", value: 4 / 3 },
  { label: "7:5", value: 7 / 5 },
  { label: "3:2", value: 3 / 2 },
  { label: "5:3", value: 5 / 3 },
  { label: "16:9", value: 16 / 9 },
] as const;


export default function ImageCropModal({ src, onCrop, onClose }: Props) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [selectedAspect, setSelectedAspect] = useState(0);
  const [showAspectMenu, setShowAspectMenu] = useState(false);
  const [blobSrc, setBlobSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Fetch image as blob to bypass CORS for canvas operations
  useEffect(() => {
    let revoke: string | null = null;
    let cancelled = false;
    // If already a blob URL, use directly
    if (src.startsWith("blob:")) {
      setBlobSrc(src);
      return;
    }
    fetch(src, { mode: "cors" })
      .then((r) => r.blob())
      .then((blob) => {
        if (cancelled) return;
        revoke = URL.createObjectURL(blob);
        setBlobSrc(revoke);
      })
      .catch(() => {
        if (cancelled) return;
        // If CORS fails, proxy through our API
        fetch(`/api/image-proxy?url=${encodeURIComponent(src)}`)
          .then((r) => r.blob())
          .then((blob) => {
            if (cancelled) return;
            revoke = URL.createObjectURL(blob);
            setBlobSrc(revoke);
          })
          .catch(() => {
            if (!cancelled) setBlobSrc(src);
          });
      });
    return () => { cancelled = true; if (revoke) URL.revokeObjectURL(revoke); };
  }, [src]);

  const aspect = ASPECT_OPTIONS[selectedAspect].value;
  const isCircle = "circle" in ASPECT_OPTIONS[selectedAspect] && ASPECT_OPTIONS[selectedAspect].circle;

  // Initialize crop to full image when loaded
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      { unit: "%", x: 0, y: 0, width: 100, height: 100 },
      width,
      height,
    );
    setCrop(initialCrop);
  }, []);

  const applyAspect = useCallback((index: number) => {
    setSelectedAspect(index);
    setShowAspectMenu(false);
    const newAspect = ASPECT_OPTIONS[index].value;
    if (!imgRef.current) return;
    const { width, height } = imgRef.current;
    if (!newAspect) {
      const freeCrop = centerCrop(
        { unit: "%", x: 0, y: 0, width: 100, height: 100 },
        width,
        height,
      );
      setCrop(freeCrop);
      return;
    }
    const newCrop = centerCrop(
      makeAspectCrop({ unit: "%", width: 80 }, newAspect, width, height),
      width,
      height,
    );
    setCrop(newCrop);
  }, []);

  const handleConfirm = useCallback(() => {
    if (!completedCrop || !imgRef.current || !blobSrc) return;
    // Create a fresh Image from the blob URL to guarantee no CORS taint
    const img = new Image();
    img.onload = () => {
      const scaleX = img.naturalWidth / imgRef.current!.width;
      const scaleY = img.naturalHeight / imgRef.current!.height;
      const canvas = document.createElement("canvas");
      canvas.width = completedCrop.width * scaleX;
      canvas.height = completedCrop.height * scaleY;
      const ctx = canvas.getContext("2d")!;
      if (isCircle) {
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
      }
      ctx.drawImage(
        img,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0, 0, canvas.width, canvas.height,
      );
      const format = isCircle ? "image/png" : "image/jpeg";
      const ext = isCircle ? "png" : "jpg";
      canvas.toBlob((blob) => {
        if (!blob) return;
        onCrop(new File([blob], `cropped.${ext}`, { type: format }));
      }, format, 0.92);
    };
    img.src = blobSrc;
  }, [completedCrop, onCrop, isCircle, blobSrc]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="relative flex items-center justify-between px-4 py-3 border-b border-border">
          {/* Aspect ratio selector */}
          <div className="relative">
            <button
              onClick={() => setShowAspectMenu(!showAspectMenu)}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
            >
              <span>{ASPECT_OPTIONS[selectedAspect].label}</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>

            {showAspectMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-border py-1 min-w-[160px] z-10">
                {ASPECT_OPTIONS.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => applyAspect(i)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center justify-between"
                  >
                    <span className={i === selectedAspect ? "font-medium" : ""}>{opt.label}</span>
                    {i === selectedAspect && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <h3 className="absolute left-1/2 -translate-x-1/2 font-semibold text-base">Ritaglia immagine</h3>

          <div className="flex items-center gap-2">
            <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5">
              Annulla
            </button>
            <button
              onClick={handleConfirm}
              disabled={!completedCrop?.width}
              className="text-sm bg-primary text-white px-4 py-1.5 rounded-lg hover:bg-primary-dark disabled:opacity-40 transition-colors font-medium"
            >
              Salva
            </button>
          </div>
        </div>

        {/* Crop area */}
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-neutral-100 min-h-[300px]">
          {!blobSrc && <div className="text-sm text-muted-foreground">Caricamento...</div>}
          {blobSrc && <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspect}
            circularCrop={isCircle}
            className="notion-crop"
          >
            <img
              ref={imgRef}
              src={blobSrc || ""}
              alt="Ritaglia"
              onLoad={onImageLoad}
              style={{ maxHeight: "70vh", maxWidth: "100%" }}
            />
          </ReactCrop>}
        </div>
      </div>

      {/* Notion-style crop handles */}
      <style>{`
        .notion-crop .ReactCrop__crop-selection {
          border: 2px solid rgba(255, 255, 255, 0.8);
          box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
          animation: none;
          background-image: none;
        }
        .notion-crop .ReactCrop__drag-handle {
          width: 20px;
          height: 20px;
          background: transparent;
          border: none;
        }
        /* Corner handles — L-shaped brackets */
        .notion-crop .ord-nw {
          border-top: 3px solid #fff;
          border-left: 3px solid #fff;
          border-right: none;
          border-bottom: none;
          border-radius: 2px 0 0 0;
        }
        .notion-crop .ord-ne {
          border-top: 3px solid #fff;
          border-right: 3px solid #fff;
          border-left: none;
          border-bottom: none;
          border-radius: 0 2px 0 0;
        }
        .notion-crop .ord-se {
          border-bottom: 3px solid #fff;
          border-right: 3px solid #fff;
          border-left: none;
          border-top: none;
          border-radius: 0 0 2px 0;
        }
        .notion-crop .ord-sw {
          border-bottom: 3px solid #fff;
          border-left: 3px solid #fff;
          border-right: none;
          border-top: none;
          border-radius: 0 0 0 2px;
        }
        /* Edge handles — small bars */
        .notion-crop .ord-n,
        .notion-crop .ord-s {
          width: 32px;
          height: 6px;
          background: rgba(255, 255, 255, 0.8);
          border: none;
          border-radius: 3px;
        }
        .notion-crop .ord-e,
        .notion-crop .ord-w {
          width: 6px;
          height: 32px;
          background: rgba(255, 255, 255, 0.8);
          border: none;
          border-radius: 3px;
        }
        .notion-crop .ReactCrop__drag-handle:focus {
          background: rgba(255, 255, 255, 0.9);
        }
        .notion-crop .ord-nw:focus,
        .notion-crop .ord-ne:focus,
        .notion-crop .ord-se:focus,
        .notion-crop .ord-sw:focus {
          background: transparent;
        }
      `}</style>
    </div>
  );
}
