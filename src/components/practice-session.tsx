"use client";

import { useState, useEffect, useCallback } from "react";
import { RotateCcw, ChevronRight } from "lucide-react";
import type { Flashcard } from "@/lib/database.types";
import type { ReviewQuality } from "@/lib/spaced-repetition";

interface Props {
  contextId: string;
  contextName: string;
}

export function PracticeSession({ contextId, contextName }: Props) {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [current, setCurrent] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/practice?context_id=${contextId}`);
    const data = await res.json();
    setCards(data);
    setCurrent(0);
    setRevealed(false);
    setDone(data.length === 0);
    setLoading(false);
  }, [contextId]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  async function handleReview(quality: ReviewQuality) {
    setSubmitting(true);
    await fetch("/api/practice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flashcard_id: cards[current].id, quality }),
    });
    setSubmitting(false);
    setRevealed(false);

    if (current + 1 >= cards.length) {
      setDone(true);
    } else {
      setCurrent((c) => c + 1);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-zinc-500">
        Loading cards...
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          {cards.length === 0
            ? "No cards due for review!"
            : "Session complete! 🎉"}
        </p>
        <button
          onClick={fetchCards}
          className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
        >
          <RotateCcw className="h-4 w-4" /> Refresh
        </button>
      </div>
    );
  }

  const card = cards[current];

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center justify-between text-sm text-zinc-500">
        <span>{contextName}</span>
        <span>
          {current + 1} / {cards.length}
        </span>
      </div>

      <div
        className="flex min-h-[250px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
        onClick={() => setRevealed(true)}
      >
        <p className="text-xs uppercase tracking-wider text-zinc-400 mb-4">
          {revealed ? "Deutsch" : "Français"}
        </p>
        <p className="text-center text-xl font-medium leading-relaxed">
          {revealed ? card.front_de : card.back_fr}
        </p>
        {!revealed && (
          <p className="mt-6 flex items-center gap-1 text-sm text-zinc-400">
            Click to reveal <ChevronRight className="h-4 w-4" />
          </p>
        )}
      </div>

      {revealed && (
        <div className="flex justify-center gap-3">
          {([
            { quality: 1 as ReviewQuality, label: "Didn't know", color: "bg-red-500 hover:bg-red-600" },
            { quality: 3 as ReviewQuality, label: "Partially", color: "bg-amber-500 hover:bg-amber-600" },
            { quality: 5 as ReviewQuality, label: "Knew it!", color: "bg-emerald-500 hover:bg-emerald-600" },
          ]).map(({ quality, label, color }) => (
            <button
              key={quality}
              onClick={() => handleReview(quality)}
              disabled={submitting}
              className={`rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50 ${color}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

