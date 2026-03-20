import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { extractText } from "@/lib/parse-document";

const FIXTURES_DIR = join(__dirname, "fixtures");

describe("extractText", () => {
  it("extracts text from a PDF file", async () => {
    const buffer = readFileSync(join(FIXTURES_DIR, "01_Einladung.pdf"));
    const text = await extractText(buffer, "application/pdf");

    expect(text).toBeTruthy();
    expect(text).toContain("E I N L A D U N G");
    expect(text).toContain("Generalversammlung");
    expect(text).toContain("Baden");
    expect(text).toContain("TRAKTANDEN");
  });

  it("extracts text from a plain text buffer", async () => {
    const content = "Hallo, wie geht es Ihnen?";
    const buffer = Buffer.from(content, "utf-8");
    const text = await extractText(buffer, "text/plain");

    expect(text).toBe(content);
  });

  it("trims whitespace from extracted text", async () => {
    const buffer = Buffer.from("  some text with spaces  ", "utf-8");
    const text = await extractText(buffer, "text/plain");

    expect(text).toBe("some text with spaces");
  });

  it("returns non-empty text for the PDF fixture", async () => {
    const buffer = readFileSync(join(FIXTURES_DIR, "01_Einladung.pdf"));
    const text = await extractText(buffer, "application/pdf");

    expect(text.length).toBeGreaterThan(100);
  });
});

