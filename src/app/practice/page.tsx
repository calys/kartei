"use client";

import { useSearchParams } from "next/navigation";
import { PracticeSession } from "@/components/practice-session";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

function PracticeContent() {
  const searchParams = useSearchParams();
  const contextId = searchParams.get("context_id");
  const contextName = searchParams.get("name") || "Practice";

  if (!contextId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-zinc-500">No context selected.</p>
        <Link href="/" className="text-sm text-zinc-600 hover:underline">
          Go back to contexts
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href={`/contexts/${contextId}`}
        className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
      >
        <ArrowLeft className="h-4 w-4" /> Back to {contextName}
      </Link>

      <h1 className="mb-8 text-2xl font-bold">Practice: {contextName}</h1>

      <PracticeSession contextId={contextId} contextName={contextName} />
    </div>
  );
}

export default function PracticePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20 text-zinc-500">
          Loading...
        </div>
      }
    >
      <PracticeContent />
    </Suspense>
  );
}

