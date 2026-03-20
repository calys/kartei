// Import the inner module directly to avoid pdf-parse's debug-mode
// auto-execution which tries to read a test file on import.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse/lib/pdf-parse.js") as (
  buffer: Buffer
) => Promise<{ text: string }>;

export async function extractText(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  if (mimeType === "application/pdf") {
    const result = await pdfParse(buffer);
    return result.text.trim();
  }

  return buffer.toString("utf-8").trim();
}

