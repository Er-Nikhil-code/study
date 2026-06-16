import React, { useMemo, useRef } from "react";
import ReactQuill, { Quill } from "react-quill-new";
// @ts-ignore
import ImageResize from "quill-image-resize-module-react";
import katex from "katex";
import "react-quill-new/dist/quill.snow.css";
import "katex/dist/katex.min.css"; // KaTeX CSS
import "./RichTextEditor.css"; // Custom styling overrides

if (typeof window !== "undefined") {
  (window as any).katex = katex;
  (window as any).Quill = Quill;
  Quill.register("modules/imageResize", ImageResize);
}

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  themeMode?: "dark" | "light";
}

export default function QuillEditorWrapper({ value, onChange, placeholder, readOnly = false, themeMode = "dark" }: RichTextEditorProps) {
  const reactQuillRef = useRef<ReactQuill>(null);

  // Custom image upload handler
  const imageHandler = async () => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files ? input.files[0] : null;
      if (!file) return;

      try {
        // Use the centralized UploadService
        const { default: uploadService } = await import("@/services/upload.service");
        const url = await uploadService.uploadImage(file);

        // Get the editor instance to insert the image
        const quill = reactQuillRef.current?.getEditor();
        if (quill) {
           const range = quill.getSelection(true); // true forces focus and gets the selection
           const index = range ? range.index : quill.getLength();
           quill.insertEmbed(index, "image", url);
           quill.setSelection(index + 1, 0); // Select immediately after the inserted image
        } else {
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
          ["link", "image", "video", "formula"],
          ["clean"],
        ],
        handlers: {
          image: imageHandler
        }
      },
      imageResize: {
        parchment: Quill.import('parchment'),
        modules: ['Resize', 'DisplaySize']
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
    "video",
    "formula"
  ];

  return (
    <div className={`rich-text-container ${readOnly ? "read-only" : ""} theme-${themeMode}`}>
      <ReactQuill
        ref={reactQuillRef}
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
