"use client";

import React from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Heading3, Undo, Redo } from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
}

const Toolbar = ({ editor }: { editor: Editor }) => {
  const tools = [
    { icon: Bold, action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold"), label: "Bold" },
    { icon: Italic, action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic"), label: "Italic" },
    { icon: Heading1, action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: editor.isActive("heading", { level: 1 }), label: "H1" },
    { icon: Heading2, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive("heading", { level: 2 }), label: "H2" },
    { icon: Heading3, action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive("heading", { level: 3 }), label: "H3" },
    { icon: List, action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive("bulletList"), label: "Bullet List" },
    { icon: ListOrdered, action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive("orderedList"), label: "Ordered List" },
    { icon: Undo, action: () => editor.chain().focus().undo().run(), active: false, label: "Undo" },
    { icon: Redo, action: () => editor.chain().focus().redo().run(), active: false, label: "Redo" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-slate-200 bg-slate-50 rounded-t-xl">
      {tools.map((tool) => (
        <button
          key={tool.label}
          onClick={tool.action}
          title={tool.label}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            tool.active ? "bg-brand-saffron/20 text-brand-burnt" : "text-slate-500 hover:text-slate-800 hover:bg-slate-200"
          }`}
        >
          <tool.icon size={16} />
        </button>
      ))}
    </div>
  );
};

export default function RichTextEditor({ value, onChange, placeholder = "Start writing...", minHeight = 200 }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none px-4 py-3",
        style: `min-height: ${minHeight}px`,
      },
    },
  });

  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
  }, [editor, value]);

  if (!editor) return null;

  return (
    <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
