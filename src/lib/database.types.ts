export interface Database {
  public: {
    Tables: {
      contexts: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
        };
      };
      documents: {
        Row: {
          id: string;
          context_id: string;
          filename: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          context_id: string;
          filename: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          context_id?: string;
          filename?: string;
          content?: string;
        };
      };
      flashcards: {
        Row: {
          id: string;
          context_id: string;
          document_id: string | null;
          front_de: string;
          back_fr: string;
          ease_factor: number;
          interval_days: number;
          repetitions: number;
          next_review_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          context_id: string;
          document_id?: string | null;
          front_de: string;
          back_fr: string;
          ease_factor?: number;
          interval_days?: number;
          repetitions?: number;
          next_review_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          ease_factor?: number;
          interval_days?: number;
          repetitions?: number;
          next_review_at?: string;
        };
      };
    };
  };
}

export type Context = Database["public"]["Tables"]["contexts"]["Row"];
export type Document = Database["public"]["Tables"]["documents"]["Row"];
export type Flashcard = Database["public"]["Tables"]["flashcards"]["Row"];

