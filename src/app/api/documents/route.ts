import { supabase } from "@/lib/supabase";
import { extractText } from "@/lib/parse-document";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const contextId = formData.get("context_id") as string | null;

  if (!file || !contextId) {
    return NextResponse.json(
      { error: "File and context_id are required" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const content = await extractText(buffer, file.type);

  if (!content.trim()) {
    return NextResponse.json(
      { error: "Could not extract text from file" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("documents")
    .insert({
      context_id: contextId,
      filename: file.name,
      content: content.trim(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

