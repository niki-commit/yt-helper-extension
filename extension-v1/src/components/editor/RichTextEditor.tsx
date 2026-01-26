import { useEffect } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, List, Code } from "lucide-react";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  editable?: boolean;
  autofocus?: boolean | "start" | "end" | "all";
}

export function RichTextEditor({
  content,
  onChange,
  onFocus,
  onBlur,
  placeholder = "Start typing...",
  editable = true,
  autofocus = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onFocus: () => onFocus?.(),
    onBlur: () => onBlur?.(),
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4 text-foreground whitespace-pre-wrap",
      },
    },
  });

  // Expose editor instance to parent if needed via useEffect or just let parent use its own logic
  // For now, we'll keep it simple and just sync content.

  // Controlled Autofocus: Only trigger if the prop is truthy
  useEffect(() => {
    if (editor && autofocus) {
      console.log(
        "[VideoNotes] Explicitly focusing editor due to autofocus prop:",
        autofocus
      );
      editor.commands.focus(autofocus === true ? "end" : autofocus);
    }
  }, [editor, autofocus]);

  // Keep editor in sync with content prop (for auto-timestamps)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border-border bg-card overflow-hidden rounded-lg border">
      {editable && <MenuBar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}

function MenuBar({ editor }: { editor: Editor }) {
  return (
    <div className="border-border bg-muted/50 flex flex-wrap gap-1 border-b p-2">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`hover:bg-accent rounded p-2 transition-colors ${
          editor.isActive("bold")
            ? "bg-accent border-accent-foreground text-accent-foreground rounded border"
            : "text-accent-foreground"
        }`}
        type="button"
      >
        <Bold className="h-4 w-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`hover:bg-accent rounded p-2 transition-colors ${
          editor.isActive("italic")
            ? "bg-accent border-accent-foreground text-accent-foreground rounded border"
            : "text-accent-foreground"
        }`}
        type="button"
      >
        <Italic className="h-4 w-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`hover:bg-accent rounded p-2 transition-colors ${
          editor.isActive("bulletList")
            ? "bg-accent border-accent-foreground text-accent-foreground rounded border"
            : "text-accent-foreground"
        }`}
        type="button"
      >
        <List className="h-4 w-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`hover:bg-accent rounded p-2 transition-colors ${
          editor.isActive("codeBlock")
            ? "bg-accent border-accent-foreground text-accent-foreground rounded border"
            : "text-accent-foreground"
        }`}
        type="button"
      >
        <Code className="h-4 w-4" />
      </button>
    </div>
  );
}
