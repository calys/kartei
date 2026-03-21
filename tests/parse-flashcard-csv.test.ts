import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { parseFlashcardCsv } from "../src/lib/parse-flashcard-csv";

describe("parseFlashcardCsv", () => {
  it("parses tab-separated lines (Anki export format)", () => {
    const input = "die Einladung\tl'invitation\nder Beschluss\tla décision";
    const result = parseFlashcardCsv(input);
    expect(result).toEqual([
      { front_de: "die Einladung", back_fr: "l'invitation" },
      { front_de: "der Beschluss", back_fr: "la décision" },
    ]);
  });

  it("parses comma-separated lines", () => {
    const input = "Hallo,Bonjour\nDanke,Merci";
    const result = parseFlashcardCsv(input);
    expect(result).toEqual([
      { front_de: "Hallo", back_fr: "Bonjour" },
      { front_de: "Danke", back_fr: "Merci" },
    ]);
  });

  it("parses semicolon-separated lines", () => {
    const input = "Hallo;Bonjour\nDanke;Merci";
    const result = parseFlashcardCsv(input);
    expect(result).toEqual([
      { front_de: "Hallo", back_fr: "Bonjour" },
      { front_de: "Danke", back_fr: "Merci" },
    ]);
  });

  it("skips Anki comment lines starting with #", () => {
    const input = "#separator:tab\n#deck:German\nHallo\tBonjour";
    const result = parseFlashcardCsv(input);
    expect(result).toEqual([{ front_de: "Hallo", back_fr: "Bonjour" }]);
  });

  it("handles a header row with known column names", () => {
    const input = "front_de\tback_fr\nHallo\tBonjour\nDanke\tMerci";
    const result = parseFlashcardCsv(input);
    expect(result).toEqual([
      { front_de: "Hallo", back_fr: "Bonjour" },
      { front_de: "Danke", back_fr: "Merci" },
    ]);
  });

  it("handles reversed header columns", () => {
    const input = "french,german\nBonjour,Hallo";
    const result = parseFlashcardCsv(input);
    expect(result).toEqual([{ front_de: "Hallo", back_fr: "Bonjour" }]);
  });

  it("handles quoted CSV fields with commas inside", () => {
    const input = '"Ja, bitte","Oui, s\'il vous plaît"';
    const result = parseFlashcardCsv(input);
    expect(result).toEqual([
      { front_de: "Ja, bitte", back_fr: "Oui, s'il vous plaît" },
    ]);
  });

  it("handles quoted fields with escaped double quotes", () => {
    const input = '"Er sagte ""Hallo""","Il a dit ""Bonjour"""';
    const result = parseFlashcardCsv(input);
    expect(result).toEqual([
      { front_de: 'Er sagte "Hallo"', back_fr: 'Il a dit "Bonjour"' },
    ]);
  });

  it("skips empty lines", () => {
    const input = "Hallo\tBonjour\n\n\nDanke\tMerci\n";
    const result = parseFlashcardCsv(input);
    expect(result).toHaveLength(2);
  });

  it("skips lines with fewer than 2 columns", () => {
    const input = "Hallo\tBonjour\nincomplete\nDanke\tMerci";
    const result = parseFlashcardCsv(input);
    expect(result).toHaveLength(2);
  });

  it("returns empty array for empty input", () => {
    expect(parseFlashcardCsv("")).toEqual([]);
    expect(parseFlashcardCsv("  \n  ")).toEqual([]);
  });

  it("handles Windows-style line endings", () => {
    const input = "Hallo\tBonjour\r\nDanke\tMerci\r\n";
    const result = parseFlashcardCsv(input);
    expect(result).toHaveLength(2);
  });

  it("ignores extra columns beyond the first two", () => {
    const input = "Hallo\tBonjour\textra\tmore";
    const result = parseFlashcardCsv(input);
    expect(result).toEqual([{ front_de: "Hallo", back_fr: "Bonjour" }]);
  });

  it("detects FR-first column order from content (no language headers)", () => {
    const input =
      "Je suis ici aujourd'hui.\tIch bin heute hier.\nMerci beaucoup.\tVielen Dank.";
    const result = parseFlashcardCsv(input);
    expect(result).toEqual([
      { front_de: "Ich bin heute hier.", back_fr: "Je suis ici aujourd'hui." },
      { front_de: "Vielen Dank.", back_fr: "Merci beaucoup." },
    ]);
  });

  it("detects FR-first column order with generic Front/Back headers", () => {
    const input =
      "Front\tBack\nJe ne suis pas encore propriétaire.\tIch bin noch nicht Eigentümer.";
    const result = parseFlashcardCsv(input);
    expect(result).toEqual([
      {
        front_de: "Ich bin noch nicht Eigentümer.",
        back_fr: "Je ne suis pas encore propriétaire.",
      },
    ]);
  });

  describe("AGM fixture file", () => {
    const content = readFileSync(
      join(__dirname, "fixtures/AGM_Anki_Flashcards_FR-DE_25-03-2026.tsv"),
      "utf-8"
    );
    const result = parseFlashcardCsv(content);

    it("parses all 105 data rows (header excluded)", () => {
      expect(result).toHaveLength(105);
    });

    it("assigns German to front_de and French to back_fr", () => {
      const first = result[0];
      expect(first.front_de).toBe("Guten Abend zusammen.");
      expect(first.back_fr).toContain("Bonsoir");
    });

    it("correctly maps every row (spot-check last card)", () => {
      const last = result[result.length - 1];
      expect(last.front_de).toBe(
        "Vielen Dank für den freundlichen Empfang."
      );
      expect(last.back_fr).toContain("Merci beaucoup");
    });

    it("never puts French content in front_de", () => {
      const frenchArticles = /\b(le|la|les|une|des|du)\b/i;
      const suspiciousCards = result.filter(
        (card) =>
          frenchArticles.test(card.front_de) &&
          !frenchArticles.test(card.back_fr)
      );
      expect(suspiciousCards).toHaveLength(0);
    });
  });
});

