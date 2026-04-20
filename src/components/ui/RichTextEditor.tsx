"use client";

import { useCreateBlockNote, SideMenuController, SideMenu } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { it as itLocale } from "@blocknote/core/locales";
import "@blocknote/mantine/style.css";
import { useEffect, useRef, useState, useCallback, lazy, Suspense } from "react";
import { AlignLeft, AlignCenter, AlignRight, Crop, Type, Trash2 } from "lucide-react";
import { CustomDragHandleMenu } from "./BlockDragHandleMenu";

const ImageCropModal = lazy(() => import("@/components/ui/ImageCropModal"));

interface Props {
  content: string;
  onChange: (html: string) => void;
  onImageUpload?: (file: File) => Promise<string | null>;
  onSave?: () => void;
  onCancel?: () => void;
  placeholder?: string;
}

export default function RichTextEditor({ content, onChange, onImageUpload, onSave, onCancel }: Props) {
  const initialized = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredImg, setHoveredImg] = useState<HTMLElement | null>(null);
  const [toolbarPos, setToolbarPos] = useState({ top: 0, right: 0 });
  const [captionBlockId, setCaptionBlockId] = useState<string | null>(null);
  const [captionValue, setCaptionValue] = useState("");
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropBlockId, setCropBlockId] = useState<string | null>(null);
  const hideTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const editor = useCreateBlockNote({
    dictionary: itLocale,
    uploadFile: onImageUpload
      ? async (file: File) => {
          const url = await onImageUpload(file);
          return url ?? "";
        }
      : undefined,
  });

  // Load initial HTML content
  useEffect(() => {
    if (initialized.current || !editor || !content) return;
    initialized.current = true;
    (async () => {
      const blocks = await editor.tryParseHTMLToBlocks(content);
      editor.replaceBlocks(editor.document, blocks);
    })();
  }, [editor, content]);

  const getBlockId = useCallback((el: HTMLElement): string | null => {
    const blockEl = el.closest("[data-id]");
    return blockEl?.getAttribute("data-id") ?? null;
  }, []);

  const showToolbar = useCallback((imgWrapper: HTMLElement) => {
    clearTimeout(hideTimeout.current);
    setHoveredImg(imgWrapper);
    const rect = imgWrapper.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;
    setToolbarPos({
      top: rect.top - containerRect.top + 8,
      right: containerRect.right - rect.right + 8,
    });
  }, []);

  const scheduleHide = useCallback(() => {
    hideTimeout.current = setTimeout(() => {
      setHoveredImg(null);
    }, 200);
  }, []);

  const cancelHide = useCallback(() => {
    clearTimeout(hideTimeout.current);
  }, []);

  // Event delegation for image hover + hide built-in toolbar for images
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const wrapper = target.closest(".bn-visual-media-wrapper") as HTMLElement;
      if (wrapper) {
        showToolbar(wrapper);
      }
    };

    const onMouseOut = (e: MouseEvent) => {
      const target = e.relatedTarget as HTMLElement | null;
      if (!target?.closest(".bn-visual-media-wrapper") && !target?.closest(".bn-image-hover-toolbar")) {
        scheduleHide();
      }
    };

    container.addEventListener("mouseover", onMouseOver);
    container.addEventListener("mouseout", onMouseOut);
    return () => {
      container.removeEventListener("mouseover", onMouseOver);
      container.removeEventListener("mouseout", onMouseOut);
    };
  }, [showToolbar, scheduleHide]);

  const handleDelete = useCallback(() => {
    if (!hoveredImg) return;
    const blockId = getBlockId(hoveredImg);
    if (blockId) {
      editor.removeBlocks([blockId]);
      setHoveredImg(null);
    }
  }, [hoveredImg, editor, getBlockId]);

  const handleAlign = useCallback((align: "left" | "center" | "right") => {
    if (!hoveredImg) return;
    const blockId = getBlockId(hoveredImg);
    if (blockId) {
      (editor as any).updateBlock(blockId, { props: { textAlignment: align } });
    }
  }, [hoveredImg, editor, getBlockId]);

  const handleCaptionToggle = useCallback(() => {
    if (!hoveredImg) return;
    const blockId = getBlockId(hoveredImg);
    if (!blockId) return;
    const block = (editor as any).getBlock(blockId);
    setCaptionBlockId(blockId);
    setCaptionValue(block?.props?.caption ?? "");
  }, [hoveredImg, editor, getBlockId]);

  const saveCaption = useCallback(() => {
    if (!captionBlockId) return;
    (editor as any).updateBlock(captionBlockId, { props: { caption: captionValue } });
    setCaptionBlockId(null);
    setCaptionValue("");
  }, [captionBlockId, captionValue, editor]);

  const handleCrop = useCallback(() => {
    if (!hoveredImg) return;
    const blockId = getBlockId(hoveredImg);
    const img = hoveredImg.querySelector("img");
    if (blockId && img?.src) {
      setCropBlockId(blockId);
      setCropSrc(img.src);
      setHoveredImg(null);
    }
  }, [hoveredImg, getBlockId]);

  const handleCropDone = useCallback(async (croppedFile: File) => {
    if (!cropBlockId || !onImageUpload) return;
    const blockId = cropBlockId; // capture before clearing state
    // Optimistic: show cropped image instantly via blob URL, close modal
    const blobUrl = URL.createObjectURL(croppedFile);
    (editor as any).updateBlock(blockId, { props: { url: blobUrl } });
    setCropSrc(null);
    setCropBlockId(null);
    // Upload in background, then replace blob URL with real URL
    const url = await onImageUpload(croppedFile);
    if (url) {
      (editor as any).updateBlock(blockId, { props: { url } });
    }
  }, [cropBlockId, onImageUpload, editor]);

  return (
    <div ref={containerRef} className="relative">
      {/* Floating save pill */}
      {(onSave || onCancel) && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-1 py-1 shadow-lg border border-border/50">
          {onCancel && (
            <button type="button" onClick={onCancel} className="text-xs text-muted-foreground hover:text-foreground px-3 py-1 rounded-full hover:bg-muted transition-colors">
              Annulla
            </button>
          )}
          {onSave && (
            <button type="button" onClick={onSave} className="text-xs bg-primary text-white px-3 py-1 rounded-full hover:bg-primary-dark transition-colors">
              Salva
            </button>
          )}
        </div>
      )}

      <BlockNoteView
        editor={editor}
        onChange={async () => {
          const html = await editor.blocksToHTMLLossy(editor.document);
          onChange(html);
        }}
        theme="light"
        data-theming-css-variables-demo
        sideMenu={false}
        formattingToolbar={false}
      >
        <SideMenuController sideMenu={() => <SideMenu dragHandleMenu={CustomDragHandleMenu} />} />
      </BlockNoteView>

      {/* Custom image hover toolbar */}
      {hoveredImg && (
        <div
          className="bn-image-hover-toolbar absolute z-50 flex items-center gap-0.5 bg-white/95 backdrop-blur-sm rounded-lg px-1.5 py-1 shadow-lg border border-border/50"
          style={{ top: toolbarPos.top, right: toolbarPos.right }}
          onMouseEnter={cancelHide}
          onMouseLeave={scheduleHide}
          onMouseDown={(e) => e.preventDefault()}
        >
          <button onClick={handleCaptionToggle} className="flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded text-foreground hover:bg-black/5" title="Descrizione">
            <Type className="h-3.5 w-3.5" />
            <span>Descrizione</span>
          </button>
          <div className="w-px h-4 bg-border mx-0.5" />
          <button onClick={() => handleAlign("left")} className="p-1 rounded hover:bg-black/5" title="Sinistra">
            <AlignLeft className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => handleAlign("center")} className="p-1 rounded hover:bg-black/5" title="Centro">
            <AlignCenter className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => handleAlign("right")} className="p-1 rounded hover:bg-black/5" title="Destra">
            <AlignRight className="h-3.5 w-3.5" />
          </button>
          <div className="w-px h-4 bg-border mx-0.5" />
          <button onClick={handleCrop} className="flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded text-foreground hover:bg-black/5" title="Taglia">
            <Crop className="h-3.5 w-3.5" />
            <span>Taglia</span>
          </button>
          <div className="w-px h-4 bg-border mx-0.5" />
          <button onClick={handleDelete} className="p-1 rounded hover:bg-red-400/20 text-red-600" title="Elimina">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Caption input popover */}
      {captionBlockId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setCaptionBlockId(null)}>
          <div className="bg-white rounded-xl shadow-2xl p-4 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-medium mb-2">Descrizione immagine</p>
            <input
              type="text"
              value={captionValue}
              onChange={(e) => setCaptionValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") saveCaption(); }}
              placeholder="Aggiungi una descrizione..."
              className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setCaptionBlockId(null)} className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5">Annulla</button>
              <button onClick={saveCaption} className="text-sm bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary-dark">Salva</button>
            </div>
          </div>
        </div>
      )}

      {/* Crop modal */}
      {cropSrc && (
        <Suspense>
          <ImageCropModal
            src={cropSrc}
            onCrop={handleCropDone}
            onClose={() => { setCropSrc(null); setCropBlockId(null); }}
          />
        </Suspense>
      )}

      <style jsx global>{`
        .bn-container {
          --bn-colors-editor-background: transparent;
          --bn-colors-editor-text: var(--muted-foreground);
          --bn-colors-menu-background: white;
          --bn-colors-menu-text: var(--foreground);
          --bn-colors-hovered-background: var(--muted);
          --bn-colors-selected-background: var(--primary-light);
          --bn-colors-disabled-background: var(--muted);
          --bn-colors-disabled-text: var(--muted-foreground);
          --bn-colors-border: var(--border);
          --bn-colors-side-menu: var(--muted-foreground);
          --bn-colors-highlights-gray-background: var(--muted);
          --bn-font-family: inherit;
          font-size: 0.9375rem;
        }
        .bn-editor {
          padding: 0 !important;
        }
        .bn-block-group > .bn-block-outer:first-child {
          margin-top: 0;
        }
        .bn-container img {
          border-radius: 0.75rem;
        }
        [data-content-type="heading"] {
          --level: 1.35em !important;
        }
        [data-content-type="heading"][data-level="2"] {
          --level: 1.2em !important;
        }
        [data-content-type="heading"][data-level="3"] {
          --level: 1.05em !important;
        }
        [data-prev-level="1"] {
          --prev-level: 1.35em !important;
        }
        [data-prev-level="2"] {
          --prev-level: 1.2em !important;
        }
        [data-prev-level="3"] {
          --prev-level: 1.05em !important;
        }
        .bn-side-menu[data-block-type="heading"][data-level="1"] {
          height: 36px !important;
        }
        .bn-side-menu[data-block-type="heading"][data-level="2"] {
          height: 33px !important;
        }
        .bn-side-menu[data-block-type="heading"][data-level="3"] {
          height: 30px !important;
        }
        .bn-editor [data-content-type="heading"] .bn-inline-content {
          color: var(--foreground) !important;
        }
        .bn-editor strong {
          color: var(--foreground);
        }
      `}</style>
    </div>
  );
}
