import type { FlashcardType } from "./database.types";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

interface FlashcardPair {
  front_de: string;
  back_fr: string;
}

const SYSTEM_PROMPTS: Record<FlashcardType, string> = {
  sentence: `You are a language learning assistant. You create flashcards to help a French speaker learn German.
Given a text (which may be in German, French, or any language), extract meaningful, representative sentences or phrases and create flashcard pairs.
Each pair has:
- front_de: A natural German sentence or phrase
- back_fr: Its French translation

Guidelines:
- Create 5-10 flashcards per request
- Use sentences that are practical, natural, and contextually relevant to the provided text
- Vary difficulty levels (some simple, some complex)
- Include useful vocabulary and grammar patterns from the text
- Sentences should be complete and grammatically correct in both languages`,

  vocabulary: `You are a language learning assistant. You create vocabulary flashcards to help a French speaker learn German.
Given a text (which may be in German, French, or any language), extract important individual words and short fixed expressions and create flashcard pairs.
Each pair has:
- front_de: A German word or short expression (with article for nouns, e.g. "die Einladung", "der Beschluss")
- back_fr: Its French translation

Guidelines:
- Create 10-15 flashcards per request
- For nouns, always include the article and capitalize the noun (e.g. "die Versammlung")
- For verbs, use the infinitive form (e.g. "beschließen")
- Include contextually relevant vocabulary from the provided text
- Prioritize words that are useful and frequently encountered
- Include a mix of nouns, verbs, adjectives, and adverbs when possible`,
};

export async function generateFlashcards(
  content: string,
  existingCards: string[] = [],
  type: FlashcardType = "sentence"
): Promise<FlashcardPair[]> {
  const existingContext =
    existingCards.length > 0
      ? `\n\nThe following flashcards already exist for this context. Do NOT generate duplicates or very similar entries:\n${existingCards.join("\n")}`
      : "";

  const systemPrompt = `${SYSTEM_PROMPTS[type]}${existingContext}\n\nRespond ONLY with a JSON array of objects with "front_de" and "back_fr" keys. No markdown, no explanation.`;

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "anthropic/claude-sonnet-4",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Create German-French ${type} flashcards based on this text:\n\n${content.slice(0, 6000)}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const text = data.choices[0]?.message?.content ?? "";

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Failed to parse flashcard response from LLM");
  }

  return JSON.parse(jsonMatch[0]) as FlashcardPair[];
}

