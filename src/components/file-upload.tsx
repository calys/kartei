"use client";

import { useState, useCallback } from "react";
import { Upload } from "lucide-react";

interface Props {
  contextId: string;
  onUploaded: () => void;
}

export function FileUpload({ contextId, onUploaded }: Props) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const uploadFile = useCallback(
    async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("context_id", contextId);

      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }
    },
    [contextId]
  );

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await uploadFile(file);
      }
      onUploaded();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <label
      className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${
        dragOver
          ? "border-zinc-500 bg-zinc-50 dark:bg-zinc-800/50"
          : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <Upload className="mb-2 h-8 w-8 text-zinc-400" />
      <span className="text-sm text-zinc-600 dark:text-zinc-400">
        {uploading
          ? "Uploading..."
          : "Drop PDF or text files here, or click to browse"}
      </span>
      <input
        type="file"
        accept=".pdf,.txt,.md"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={uploading}
      />
    </label>
  );
}

