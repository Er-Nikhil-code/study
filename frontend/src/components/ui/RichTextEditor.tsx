"use client";

import dynamic from "next/dynamic";

const QuillEditorWrapper = dynamic(() => import("./QuillEditorWrapper"), {
  ssr: false,
  loading: () => <div className="h-48 w-full rounded-lg bg-white/5 border border-white/10" />,
});

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  themeMode?: "dark" | "light";
}

export default function RichTextEditor({ value, onChange, placeholder, readOnly = false, themeMode = "dark" }: RichTextEditorProps) {
  return (
    <QuillEditorWrapper
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      readOnly={readOnly}
      themeMode={themeMode}
    />
  );
}
