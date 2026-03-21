"use client";

import { useState, useEffect, useCallback, use } from "react";
import { FileUpload } from "@/components/file-upload";
import { ArrowLeft, Sparkles, FileText, Trash2 } from "lucide-react";
import Link from "next/link";
import type { Context, Document, Flashcard, FlashcardType } from "@/lib/database.types";

type Tab = "documents" | "sentences" | "vocabulary" | "stats";

export default function ContextDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [context, setContext] = useState<Context | null>(null);
  const [documents, setDocuments] = useState<Pick<Document, "id" | "filename" | "created_at">[]>([]);
  const [sentences, setSentences] = useState<Flashcard[]>([]);
  const [vocabulary, setVocabulary] = useState<Flashcard[]>([]);
  const [generatingType, setGeneratingType] = useState<FlashcardType | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("documents");

  const fetchDocuments = useCallback(async () => {
    const res = await fetch(`/api/documents?context_id=${id}`);
    if (res.ok) setDocuments(await res.json());
  }, [id]);

  const fetchFlashcards = useCallback(async () => {
    const [sentRes, vocRes] = await Promise.all([
      fetch(`/api/flashcards?context_id=${id}&type=sentence`),
      fetch(`/api/flashcards?context_id=${id}&type=vocabulary`),
    ]);
    if (sentRes.ok) setSentences(await sentRes.json());
    if (vocRes.ok) setVocabulary(await vocRes.json());
  }, [id]);

  const fetchData = useCallback(async () => {
    const ctxRes = await fetch(`/api/contexts`);
    const contexts = await ctxRes.json();
    const ctx = contexts.find((c: Context) => c.id === id);
    setContext(ctx || null);
    fetchDocuments();
    fetchFlashcards();
  }, [id, fetchDocuments, fetchFlashcards]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleGenerate(type: FlashcardType) {
    setGeneratingType(type);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context_id: id, type }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Generation failed");
      }
      await fetchFlashcards();
      setActiveTab(type === "sentence" ? "sentences" : "vocabulary");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGeneratingType(null);
    }
  }

  async function handleDeleteCard(cardId: string, type: FlashcardType) {
    await fetch("/api/flashcards", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: cardId }),
    });
    const setter = type === "sentence" ? setSentences : setVocabulary;
    setter((prev) => prev.filter((c) => c.id !== cardId));
  }

  async function handleDeleteDocument(docId: string) {
    await fetch("/api/documents", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: docId }),
    });
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
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
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
        {([
          { key: "documents" as Tab, label: "Documents", count: documents.length },
          { key: "sentences" as Tab, label: "Sentences", count: sentences.length },
          { key: "vocabulary" as Tab, label: "Vocabulary", count: vocabulary.length },
          { key: "stats" as Tab, label: "Stats", count: null },
        ]).map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === key
                ? "bg-white shadow-sm dark:bg-zinc-700"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            {label}
            {count !== null ? ` (${count})` : ""}
          </button>
        ))}
      </div>

      {activeTab === "documents" && (
        <div className="space-y-4">
          <FileUpload contextId={id} onUploaded={fetchData} />
          {documents.length > 0 && (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-200 p-3 dark:border-zinc-800"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-zinc-400" />
                    <div>
                      <p className="text-sm font-medium">{doc.filename}</p>
                      <p className="text-xs text-zinc-500">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteDocument(doc.id)}
                    className="text-zinc-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "sentences" && (
        <FlashcardList
          cards={sentences}
          type="sentence"
          contextId={id}
          contextName={context.name}
          generating={generatingType === "sentence"}
          onGenerate={() => handleGenerate("sentence")}
          onDelete={(cardId) => handleDeleteCard(cardId, "sentence")}
        />
      )}

      {activeTab === "vocabulary" && (
        <FlashcardList
          cards={vocabulary}
          type="vocabulary"
          contextId={id}
          contextName={context.name}
          generating={generatingType === "vocabulary"}
          onGenerate={() => handleGenerate("vocabulary")}
          onDelete={(cardId) => handleDeleteCard(cardId, "vocabulary")}
        />
      )}

      {activeTab === "stats" && (
        <StatsView sentences={sentences} vocabulary={vocabulary} />
      )}
    </div>
  );
}

function FlashcardList({
  cards,
  type,
  contextId,
  contextName,
  generating,
  onGenerate,
  onDelete,
}: {
  cards: Flashcard[];
  type: FlashcardType;
  contextId: string;
  contextName: string;
  generating: boolean;
  onGenerate: () => void;
  onDelete: (cardId: string) => void;
}) {
  const label = type === "sentence" ? "Sentences" : "Vocabulary";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={onGenerate}
            disabled={generating}
            className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            <Sparkles className="h-4 w-4" />
            {generating ? "Generating..." : `Generate ${label}`}
          </button>
          {cards.length > 0 && (
            <Link
              href={`/practice?context_id=${contextId}&type=${type}&name=${encodeURIComponent(contextName)}`}
              className="flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Practice
            </Link>
          )}
        </div>
      </div>

      {cards.length === 0 ? (
        <p className="py-8 text-center text-zinc-500">
          No {label.toLowerCase()} yet. Upload documents and generate them.
        </p>
      ) : (
        <div className="space-y-3">
          {cards.map((card) => (
            <div
              key={card.id}
              className="flex items-start justify-between rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <div className="space-y-1">
                <p className="font-medium">{card.front_de}</p>
                <p className="text-sm text-zinc-500">{card.back_fr}</p>
              </div>
              <button
                onClick={() => onDelete(card.id)}
                className="text-zinc-400 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProgressSection({
  label,
  flashcards,
}: {
  label: string;
  flashcards: Flashcard[];
}) {
  if (flashcards.length === 0) return null;

  const now = new Date();
  const dueNow = flashcards.filter((c) => new Date(c.next_review_at) <= now);
  const mastered = flashcards.filter((c) => c.repetitions >= 5);
  const learning = flashcards.filter(
    (c) => c.repetitions > 0 && c.repetitions < 5
  );
  const unseen = flashcards.filter((c) => c.repetitions === 0);

  const buckets = [
    { label: "New", count: unseen.length, color: "bg-zinc-400" },
    { label: "Learning", count: learning.length, color: "bg-amber-500" },
    { label: "Mastered", count: mastered.length, color: "bg-emerald-500" },
  ];

  const total = flashcards.length;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
        {label}
      </h3>

      <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <p className="text-sm text-zinc-500">Due for review</p>
        <p className="text-3xl font-bold">{dueNow.length}</p>
      </div>

      <div>
        <div className="mb-2 flex justify-between text-sm text-zinc-500">
          <span>Progress</span>
          <span>
            {Math.round((mastered.length / total) * 100)}% mastered
          </span>
        </div>
        <div className="flex h-3 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          {buckets.map(
            (b) =>
              b.count > 0 && (
                <div
                  key={b.label}
                  className={`${b.color} transition-all`}
                  style={{ width: `${(b.count / total) * 100}%` }}
                />
              )
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {buckets.map((b) => (
          <div
            key={b.label}
            className="rounded-xl border border-zinc-200 p-3 text-center dark:border-zinc-800"
          >
            <div className="flex items-center justify-center gap-2">
              <span
                className={`inline-block h-2.5 w-2.5 rounded-full ${b.color}`}
              />
              <span className="text-xs text-zinc-500">{b.label}</span>
            </div>
            <p className="mt-1 text-xl font-semibold">{b.count}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatsView({
  sentences,
  vocabulary,
}: {
  sentences: Flashcard[];
  vocabulary: Flashcard[];
}) {
  if (sentences.length === 0 && vocabulary.length === 0) {
    return (
      <p className="py-8 text-center text-zinc-500">
        No flashcards to show stats for.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <ProgressSection label="Sentences" flashcards={sentences} />
      <ProgressSection label="Vocabulary" flashcards={vocabulary} />
    </div>
  );
}

