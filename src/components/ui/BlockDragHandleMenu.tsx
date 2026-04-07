"use client";

import {
  DragHandleMenu,
  RemoveBlockItem,
  BlockColorsItem,
  useBlockNoteEditor,
} from "@blocknote/react";

const BLOCK_TYPES = [
  { label: "Testo", type: "paragraph", props: {}, icon: "Aa" },
  { label: "Titolo 1", type: "heading", props: { level: 1 }, icon: "H1" },
  { label: "Titolo 2", type: "heading", props: { level: 2 }, icon: "H2" },
  { label: "Titolo 3", type: "heading", props: { level: 3 }, icon: "H3" },
  { label: "Elenco puntato", type: "bulletListItem", props: {}, icon: "•" },
  { label: "Elenco numerato", type: "numberedListItem", props: {}, icon: "1." },
];

function BlockTypeItem({ label, icon, type, props, isActive }: { label: string; icon: string; type: string; props: Record<string, unknown>; isActive: boolean }) {
  const editor = useBlockNoteEditor<any, any, any>();

  return (
    <div
      className="bn-menu-item flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-[var(--muted)] rounded"
      role="menuitem"
      onClick={() => {
        const block = editor.getTextCursorPosition().block;
        editor.updateBlock(block, { type: type as any, props });
      }}
    >
      <span className={`w-6 text-center text-xs font-semibold ${isActive ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"}`}>{icon}</span>
      <span className={isActive ? "font-semibold" : ""}>{label}</span>
    </div>
  );
}

export function CustomDragHandleMenu() {
  const editor = useBlockNoteEditor<any, any, any>();
  const block = editor.getTextCursorPosition().block;
  const currentType = block.type;
  const currentLevel = (block.props as any)?.level;

  return (
    <DragHandleMenu>
      <div className="px-2 py-1 text-[11px] font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
        Trasforma in
      </div>
      {BLOCK_TYPES.map((bt) => {
        const isActive = bt.type === currentType && (!bt.props.level || bt.props.level === currentLevel);
        return (
          <BlockTypeItem
            key={bt.label}
            label={bt.label}
            icon={bt.icon}
            type={bt.type}
            props={bt.props}
            isActive={isActive}
          />
        );
      })}
      <div className="h-px bg-[var(--border)] my-1 mx-2" />
      <RemoveBlockItem>Elimina</RemoveBlockItem>
      <BlockColorsItem>Colori</BlockColorsItem>
    </DragHandleMenu>
  );
}
