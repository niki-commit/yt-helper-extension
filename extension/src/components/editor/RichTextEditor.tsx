import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Icon } from "@iconify/react";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Start typing...",
  editable = true,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4",
      },
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      {editable && <MenuBar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}

function MenuBar({ editor }: { editor: Editor }) {
  return (
    <div className="flex flex-wrap gap-1 border-b bg-zinc-50 p-2 dark:bg-zinc-900">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`rounded p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 ${
          editor.isActive("bold") ? "bg-zinc-200 dark:bg-zinc-800" : ""
        }`}
        type="button"
      >
        <Icon icon="lucide:bold" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`rounded p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 ${
          editor.isActive("italic") ? "bg-zinc-200 dark:bg-zinc-800" : ""
        }`}
        type="button"
      >
        <Icon icon="lucide:italic" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`rounded p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 ${
          editor.isActive("bulletList") ? "bg-zinc-200 dark:bg-zinc-800" : ""
        }`}
        type="button"
      >
        <Icon icon="lucide:list" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`rounded p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 ${
          editor.isActive("codeBlock") ? "bg-zinc-200 dark:bg-zinc-800" : ""
        }`}
        type="button"
      >
        <Icon icon="lucide:code" />
      </button>
    </div>
  );
}
