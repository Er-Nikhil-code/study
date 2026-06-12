"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import "react-quill-new/dist/quill.snow.css";
import "./RichTextEditor.css"; // Custom styling overrides

// Dynamic import of react-quill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => <div className="h-48 w-full hidden rounded-lg bg-white/5 border border-white/10" />,
});

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

export default function RichTextEditor({ value, onChange, placeholder, readOnly = false }: RichTextEditorProps) {
  // Custom image upload handler
  const imageHandler = async () => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files ? input.files[0] : null;
      if (!file) return;

      const formData = new FormData();
      formData.append("file", file);

      try {
        // We use the auth token from local storage
        const token = localStorage.getItem("accessToken");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "/api"}/upload/image`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: formData,
        });

        if (!res.ok) throw new Error("Upload failed");

        const data = await res.json();
        const url = data.url;

        // Get the editor instance to insert the image
        const quill = (document.querySelector('.ql-editor') as any).__quill; 
        if (quill) {
           const range = quill.getSelection();
           const index = range ? range.index : quill.getLength();
           quill.insertEmbed(index, "image", url);
           quill.setSelection(index + 1);
        } else {
           // Fallback if quill instance hack doesn't work (which sometimes it doesn't in react-quill)
           // Standard way:
           // In react-quill-new, getting the quill instance is tricky without a ref, so we append the image tag manually if needed.
           // To be safe, we just append it to the current value.
           const imgTag = `<img src="${url}" alt="Uploaded image" />`;
           onChange(value + imgTag);
        }
      } catch (err) {
        console.error("Image upload failed:", err);
        alert("Failed to upload image. Please try again.");
      }
    };
  };

  // Modules configuration for the Quill editor
  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ color: [] }, { background: [] }],
          [{ list: "ordered" }, { list: "bullet" }],
          ["blockquote", "code-block"],
          ["link", "image", "video"],
          ["clean"],
        ],
        handlers: {
          image: imageHandler
        }
      }
    }),
    [value, onChange] // Dependencies for fallback value append
  );

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "list",
    "blockquote",
    "code-block",
    "link",
    "image",
    "video"
  ];

  return (
    <div className={`rich-text-container ${readOnly ? "read-only" : ""}`}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder || "Write your notes here..."}
        readOnly={readOnly}
      />
    </div>
  );
}
