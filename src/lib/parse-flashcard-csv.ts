export interface FlashcardPair {
  front_de: string;
  back_fr: string;
}

const DE_HEADERS = ["front_de", "deutsch", "german", "de"];
const FR_HEADERS = ["back_fr", "français", "french", "fr"];
const GENERIC_HEADERS = ["front", "back", "question", "answer"];
const ALL_HEADERS = [...DE_HEADERS, ...FR_HEADERS, ...GENERIC_HEADERS];

// Common French markers: articles, prepositions, accented characters typical of French
const FR_MARKERS = [
  /\bl[ea']|l'|d'|qu'|n'|s'|j'|c'|m'/i,
  /\b(le|la|les|un|une|des|du|de|au|aux)\b/i,
  /\b(je|tu|il|elle|nous|vous|ils|elles|on)\b/i,
  /\b(est|sont|avoir|être|faire|dire|aller|voir|pouvoir|vouloir)\b/i,
  /[éèêëàâùûôîïç]/,
];

// Common German markers: articles, umlauts, capitalized nouns, ß
const DE_MARKERS = [
  /\b(der|die|das|ein|eine|einen|einem|einer|des|dem|den)\b/,
  /\b(ich|du|er|sie|wir|ihr|es|man)\b/i,
  /\b(ist|sind|haben|sein|werden|kann|muss|soll|darf|wird)\b/i,
  /[äöüÄÖÜß]/,
];

function computeLanguageScore(texts: string[]): { frScore: number; deScore: number } {
  let frScore = 0;
  let deScore = 0;
  for (const text of texts) {
    for (const re of FR_MARKERS) {
      if (re.test(text)) frScore++;
    }
    for (const re of DE_MARKERS) {
      if (re.test(text)) deScore++;
    }
  }
  return { frScore, deScore };
}

function detectSeparator(firstDataLine: string): string {
  if (firstDataLine.includes("\t")) return "\t";
  if (firstDataLine.includes(";")) return ";";
  return ",";
}

export function splitCsvLine(line: string, sep: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === sep) {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

type HeaderInfo =
  | { kind: "language"; deIdx: number; frIdx: number }
  | { kind: "generic" }
  | { kind: "none" };

function analyzeHeaders(fields: string[]): HeaderInfo {
  if (fields.length < 2) return { kind: "none" };
  const a = fields[0].toLowerCase();
  const b = fields[1].toLowerCase();

  const aIsDe = DE_HEADERS.includes(a);
  const aIsFr = FR_HEADERS.includes(a);
  const bIsDe = DE_HEADERS.includes(b);
  const bIsFr = FR_HEADERS.includes(b);

  if (aIsDe && bIsFr) return { kind: "language", deIdx: 0, frIdx: 1 };
  if (aIsFr && bIsDe) return { kind: "language", deIdx: 1, frIdx: 0 };

  const aIsGeneric = GENERIC_HEADERS.includes(a);
  const bIsGeneric = GENERIC_HEADERS.includes(b);
  if ((aIsGeneric || aIsDe || aIsFr) && (bIsGeneric || bIsDe || bIsFr)) {
    return { kind: "generic" };
  }

  return { kind: "none" };
}

function detectLanguageColumns(
  lines: string[],
  sep: string,
  startIndex: number
): { deIdx: number; frIdx: number } {
  const sampleSize = Math.min(10, lines.length - startIndex);
  const col0Texts: string[] = [];
  const col1Texts: string[] = [];

  for (let i = startIndex; i < startIndex + sampleSize; i++) {
    const fields = splitCsvLine(lines[i], sep);
    if (fields.length >= 2) {
      col0Texts.push(fields[0]);
      col1Texts.push(fields[1]);
    }
  }

  const col0Score = computeLanguageScore(col0Texts);
  const col1Score = computeLanguageScore(col1Texts);

  // Compare: which column is more French, which is more German?
  const col0IsFrench = col0Score.frScore - col0Score.deScore;
  const col1IsFrench = col1Score.frScore - col1Score.deScore;

  if (col0IsFrench > col1IsFrench) {
    return { deIdx: 1, frIdx: 0 };
  }
  return { deIdx: 0, frIdx: 1 };
}

export function parseFlashcardCsv(content: string): FlashcardPair[] {
  const lines = content
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "" && !line.startsWith("#"));

  if (lines.length === 0) return [];

  const sep = detectSeparator(lines[0]);
  const firstFields = splitCsvLine(lines[0], sep);
  const headerInfo = analyzeHeaders(firstFields);

  let startIndex = 0;
  let deIdx = 0;
  let frIdx = 1;

  if (headerInfo.kind === "language") {
    deIdx = headerInfo.deIdx;
    frIdx = headerInfo.frIdx;
    startIndex = 1;
  } else if (headerInfo.kind === "generic") {
    startIndex = 1;
    const detected = detectLanguageColumns(lines, sep, startIndex);
    deIdx = detected.deIdx;
    frIdx = detected.frIdx;
  } else {
    // No header — detect from content
    const detected = detectLanguageColumns(lines, sep, 0);
    deIdx = detected.deIdx;
    frIdx = detected.frIdx;
  }

  const pairs: FlashcardPair[] = [];

  for (let i = startIndex; i < lines.length; i++) {
    const fields = splitCsvLine(lines[i], sep);
    if (fields.length < 2) continue;

    const de = fields[deIdx];
    const fr = fields[frIdx];
    if (!de || !fr) continue;

    pairs.push({ front_de: de, back_fr: fr });
  }

  return pairs;
}

