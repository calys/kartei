import { supabase } from "@/lib/supabase";
import { extractText } from "@/lib/parse-document";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const contextId = request.nextUrl.searchParams.get("context_id");

  if (!contextId) {
    return NextResponse.json(
      { error: "context_id is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("documents")
    .select("id, context_id, filename, created_at")
    .eq("context_id", contextId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

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

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const { error } = await supabase.from("documents").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
