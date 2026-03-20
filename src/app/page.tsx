"use client";

import { useState, useEffect } from "react";
import { Plus, FolderOpen, BookOpen } from "lucide-react";
import Link from "next/link";
import { CreateContextDialog } from "@/components/create-context-dialog";

interface ContextWithCounts {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  documents: [{ count: number }];
  flashcards: [{ count: number }];
}

export default function Home() {
  const [contexts, setContexts] = useState<ContextWithCounts[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  async function fetchContexts() {
    const res = await fetch("/api/contexts");
    setContexts(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    fetchContexts();
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kartei</h1>
          <p className="mt-1 text-zinc-500">
            Learn German with contextual flashcards
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          <Plus className="h-4 w-4" /> New Context
        </button>
      </div>

      {loading ? (
        <p className="py-12 text-center text-zinc-500">Loading...</p>
      ) : contexts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 py-16 dark:border-zinc-700">
          <FolderOpen className="mb-3 h-12 w-12 text-zinc-300 dark:text-zinc-600" />
          <p className="text-zinc-500">No contexts yet</p>
          <p className="mt-1 text-sm text-zinc-400">
            Create a context to start adding documents and generating flashcards
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {contexts.map((ctx) => (
            <Link
              key={ctx.id}
              href={`/contexts/${ctx.id}`}
              className="group flex items-center justify-between rounded-xl border border-zinc-200 p-5 transition-all hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:hover:border-zinc-700"
            >
              <div>
                <h2 className="font-semibold group-hover:text-zinc-600 dark:group-hover:text-zinc-300">
                  {ctx.name}
                </h2>
                {ctx.description && (
                  <p className="mt-0.5 text-sm text-zinc-500">
                    {ctx.description}
                  </p>
                )}
                <div className="mt-2 flex gap-4 text-xs text-zinc-400">
                  <span>{ctx.documents[0]?.count ?? 0} documents</span>
                  <span>{ctx.flashcards[0]?.count ?? 0} flashcards</span>
                </div>
              </div>
              <BookOpen className="h-5 w-5 text-zinc-300 group-hover:text-zinc-500 dark:text-zinc-600" />
            </Link>
          ))}
        </div>
      )}

      <CreateContextDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={fetchContexts}
      />
    </div>
  );
}
