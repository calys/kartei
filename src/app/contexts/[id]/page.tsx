"use client";

import { useState, useEffect, useCallback, use } from "react";
import { FileUpload } from "@/components/file-upload";
import { ArrowLeft, Sparkles, FileText, Trash2 } from "lucide-react";
import Link from "next/link";
import type { Context, Document, Flashcard } from "@/lib/database.types";

export default function ContextDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [context, setContext] = useState<Context | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"documents" | "flashcards">(
    "documents"
  );

  const fetchData = useCallback(async () => {
    const [ctxRes, cardsRes] = await Promise.all([
      fetch(`/api/contexts`),
      fetch(`/api/flashcards?context_id=${id}`),
    ]);
    const contexts = await ctxRes.json();
    const ctx = contexts.find((c: Context) => c.id === id);
    setContext(ctx || null);
    setFlashcards(await cardsRes.json());
  }, [id]);

  const fetchDocuments = useCallback(async () => {
    // Documents are fetched via the context's documents relation
    // For now, we track them in local state after upload
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context_id: id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Generation failed");
      }
      await fetchData();
      setActiveTab("flashcards");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function handleDeleteCard(cardId: string) {
    await fetch("/api/flashcards", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: cardId }),
    });
    setFlashcards((prev) => prev.filter((c) => c.id !== cardId));
  }

  if (!context) {
    return (
      <div className="flex items-center justify-center py-20 text-zinc-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{context.name}</h1>
          {context.description && (
            <p className="mt-1 text-zinc-500">{context.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            <Sparkles className="h-4 w-4" />
            {generating ? "Generating..." : "Generate Cards"}
          </button>
          <Link
            href={`/practice?context_id=${id}&name=${encodeURIComponent(context.name)}`}
            className="flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Practice
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
        {(["documents", "flashcards"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? "bg-white shadow-sm dark:bg-zinc-700"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            {tab} {tab === "flashcards" && `(${flashcards.length})`}
          </button>
        ))}
      </div>

      {activeTab === "documents" && (
        <div className="space-y-4">
          <FileUpload contextId={id} onUploaded={fetchData} />
        </div>
      )}

      {activeTab === "flashcards" && (
        <div className="space-y-3">
          {flashcards.length === 0 ? (
            <p className="py-8 text-center text-zinc-500">
              No flashcards yet. Upload documents and click &quot;Generate
              Cards&quot;.
            </p>
          ) : (
            flashcards.map((card) => (
              <div
                key={card.id}
                className="flex items-start justify-between rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <div className="space-y-1">
                  <p className="font-medium">{card.front_de}</p>
                  <p className="text-sm text-zinc-500">{card.back_fr}</p>
                </div>
                <button
                  onClick={() => handleDeleteCard(card.id)}
                  className="text-zinc-400 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

