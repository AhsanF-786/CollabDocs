import type { Editor } from "@tiptap/react";
import {
  Bold,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Underline,
  Undo2,
} from "lucide-react";

interface EditorToolbarProps {
  editor: Editor | null;
}

interface ToolButtonProps {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function ToolButton({
  label,
  active = false,
  disabled = false,
  onClick,
  children,
}: ToolButtonProps) {
  return (
    <button
      className={`toolbar-button ${active ? "toolbar-button--active" : ""}`}
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return <div className="editor-toolbar" aria-hidden="true" />;

  return (
    <div className="editor-toolbar" role="toolbar" aria-label="Text formatting">
      <div className="toolbar-group">
        <ToolButton
          label="Undo"
          disabled={!editor.can().chain().focus().undo().run()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 size={17} />
        </ToolButton>
        <ToolButton
          label="Redo"
          disabled={!editor.can().chain().focus().redo().run()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 size={17} />
        </ToolButton>
      </div>
      <span className="toolbar-divider" />
      <div className="toolbar-group">
        <ToolButton
          label="Heading 1"
          active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 size={18} />
        </ToolButton>
        <ToolButton
          label="Heading 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 size={18} />
        </ToolButton>
      </div>
      <span className="toolbar-divider" />
      <div className="toolbar-group">
        <ToolButton
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={17} />
        </ToolButton>
        <ToolButton
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={17} />
        </ToolButton>
        <ToolButton
          label="Underline"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <Underline size={17} />
        </ToolButton>
      </div>
      <span className="toolbar-divider" />
      <div className="toolbar-group">
        <ToolButton
          label="Bulleted list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={18} />
        </ToolButton>
        <ToolButton
          label="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={18} />
        </ToolButton>
      </div>
    </div>
  );
}

