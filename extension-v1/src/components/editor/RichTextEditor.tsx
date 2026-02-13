import { useEffect, useReducer } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, List, Code } from "lucide-react";
import {
  ShadowTooltip,
  ShadowTooltipContent,
  ShadowTooltipTrigger,
} from "@/components/ui/ShadowTooltip";

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
  // Force re-render on editor updates to ensure button states are reactive
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

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
    // Crucial: Update UI on every transaction (selection change, cursor move, property change)
    onTransaction: () => {
      forceUpdate();
    },
    onFocus: () => onFocus?.(),
    onBlur: () => onBlur?.(),
    editorProps: {
      attributes: {
        class:
          "prose prose-sm vn-editor-content max-w-none focus:outline-none min-h-[200px] p-4 text-foreground whitespace-pre-wrap",
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
  // Buttons for the editor
  const items = [
    {
      icon: Bold,
      label: "Bold",
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive("bold"),
    },
    {
      icon: Italic,
      label: "Italic",
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive("italic"),
    },
    {
      icon: List,
      label: "Bullet List",
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive("bulletList"),
    },
    {
      icon: Code,
      label: "Code Block",
      action: () => editor.chain().focus().toggleCodeBlock().run(),
      isActive: editor.isActive("codeBlock"),
    },
  ];

  return (
    <div className="border-border bg-muted/50 flex flex-wrap gap-1 border-b p-2">
      {items.map((item, index) => (
        <ShadowTooltip key={index}>
          <ShadowTooltipTrigger asChild>
            <button
              onClick={item.action}
              className={`hover:bg-accent rounded p-2 transition-colors ${
                item.isActive
                  ? "bg-accent border-accent-foreground text-accent-foreground rounded border"
                  : "text-accent-foreground"
              }`}
              type="button"
            >
              <item.icon className="h-4 w-4" />
            </button>
          </ShadowTooltipTrigger>
          <ShadowTooltipContent side="top">
            <p>{item.label}</p>
          </ShadowTooltipContent>
        </ShadowTooltip>
      ))}
    </div>
  );
}
