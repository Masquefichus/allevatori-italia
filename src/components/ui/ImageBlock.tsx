"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { useState, useRef, useCallback } from "react";
import {
  AlignLeft, AlignCenter, Trash2,
} from "lucide-react";

// ── NodeView Component ──────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ImageBlockView(props: any) {
  const { node, updateAttributes, deleteNode, selected } = props;
  const { src, caption, width, align } = node.attrs as { src: string; caption: string; width: number; align: string };
  const [showToolbar, setShowToolbar] = useState(false);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const onDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    startX.current = e.clientX;
    startWidth.current = width;

    const onMove = (ev: MouseEvent) => {
      if (!containerRef.current) return;
      const parentWidth = containerRef.current.parentElement?.offsetWidth ?? 600;
      const dx = ev.clientX - startX.current;
      const newPct = Math.max(20, Math.min(100, startWidth.current + (dx / parentWidth) * 100));
      updateAttributes({ width: Math.round(newPct) });
    };

    const onUp = () => {
      setDragging(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [width, updateAttributes]);

  const justifyClass = align === "center" ? "justify-center" : "justify-start";

  return (
    <NodeViewWrapper className={`flex ${justifyClass} my-3`}>
      <div
        ref={containerRef}
        className="relative group"
        style={{ width: `${width}%` }}
        onMouseEnter={() => setShowToolbar(true)}
        onMouseLeave={() => { if (!dragging) setShowToolbar(false); }}
      >
        {/* Image */}
        <div className={`relative rounded-xl overflow-hidden bg-muted ${selected ? "ring-2 ring-primary/40" : ""}`}>
          <img src={src} alt={caption || ""} className="w-full block" draggable={false} />

          {/* Floating toolbar — inside image, top-right like Notion */}
          {(showToolbar || selected) && (
            <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-white/90 backdrop-blur-sm text-foreground rounded-lg px-1.5 py-1 shadow-lg z-10">
              {[25, 50, 75, 100].map((w) => (
                <button
                  key={w}
                  onClick={() => updateAttributes({ width: w })}
                  className={`text-[11px] px-1.5 py-0.5 rounded ${width === w ? "bg-black/10" : "hover:bg-black/5"}`}
                >
                  {w}%
                </button>
              ))}
              <div className="w-px h-4 bg-black/10 mx-0.5" />
              <button
                onClick={() => updateAttributes({ align: align === "center" ? "left" : "center" })}
                className="p-1 rounded hover:bg-black/5"
                title={align === "center" ? "Allinea a sinistra" : "Centra"}
              >
                {align === "center" ? <AlignLeft className="h-3.5 w-3.5" /> : <AlignCenter className="h-3.5 w-3.5" />}
              </button>
              <div className="w-px h-4 bg-black/10 mx-0.5" />
              <button onClick={deleteNode} className="p-1 rounded hover:bg-red-400/20 text-red-600" title="Rimuovi">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Resize handle — right edge */}
          <div
            className="absolute top-0 right-0 w-3 h-full cursor-col-resize opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            onMouseDown={onDragStart}
          >
            <div className="w-1 h-10 rounded-full bg-foreground/30" />
          </div>
        </div>

        {/* Caption */}
        <div className="mt-1.5">
          <input
            type="text"
            value={caption || ""}
            onChange={(e) => updateAttributes({ caption: e.target.value })}
            placeholder="Aggiungi didascalia..."
            className="w-full text-xs text-muted-foreground text-center bg-transparent border-none outline-none placeholder:text-muted-foreground/50"
          />
        </div>
      </div>
    </NodeViewWrapper>
  );
}

// ── Read-only version for display ───────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ImageBlockReadOnly(props: any) {
  const { node } = props;
  const { src, caption, width, align } = node.attrs as { src: string; caption: string; width: number; align: string };
  const justifyClass = align === "center" ? "justify-center" : "justify-start";

  return (
    <NodeViewWrapper className={`flex ${justifyClass} my-3`}>
      <div style={{ width: `${width}%` }}>
        <div className="rounded-xl overflow-hidden bg-muted">
          <img src={src} alt={caption || ""} className="w-full block" />
        </div>
        {caption && (
          <p className="text-xs text-muted-foreground text-center mt-1.5">{caption}</p>
        )}
      </div>
    </NodeViewWrapper>
  );
}

// ── Tiptap Extension ────────────────────────────────────────────────────────
export const ImageBlock = Node.create({
  name: "imageBlock",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: "" },
      caption: { default: "" },
      width: { default: 100 },
      align: { default: "center" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-image-block]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const { src, caption, width, align } = HTMLAttributes;
    return [
      "div",
      mergeAttributes({ "data-image-block": "", style: `display:flex;justify-content:${align === "center" ? "center" : "flex-start"}` }),
      [
        "figure",
        { style: `width:${width}%` },
        ["img", { src, style: "width:100%;border-radius:0.75rem" }],
        ...(caption ? [["figcaption", { style: "text-align:center;font-size:0.75rem;color:#78716c;margin-top:0.375rem" }, caption]] : []),
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageBlockView);
  },
});

// Read-only version of the extension (no editing controls)
export const ImageBlockReadonly = Node.create({
  name: "imageBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: "" },
      caption: { default: "" },
      width: { default: 100 },
      align: { default: "center" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-image-block]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const { src, caption, width, align } = HTMLAttributes;
    return [
      "div",
      mergeAttributes({ "data-image-block": "", style: `display:flex;justify-content:${align === "center" ? "center" : "flex-start"}` }),
      [
        "figure",
        { style: `width:${width}%` },
        ["img", { src, style: "width:100%;border-radius:0.75rem" }],
        ...(caption ? [["figcaption", { style: "text-align:center;font-size:0.75rem;color:#78716c;margin-top:0.375rem" }, caption]] : []),
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageBlockReadOnly);
  },
});
