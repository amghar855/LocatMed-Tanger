export type ChatIntent = "general" | "booking" | "pharmacy" | "discover";

export type ChatSuggestionType = "action" | "hospital" | "pharmacy";

export interface ChatSuggestion {
  id: string;
  type: ChatSuggestionType;
  title: string;
  subtitle?: string;
  href: string;
}

export interface ChatbotResponse {
  answer: string;
  intent: ChatIntent;
  suggestions: ChatSuggestion[];
  retrieval?: {
    used: boolean;
    pharmacySuggestionCount: number;
    usedMedicineAvailabilitySearch: boolean;
    usedOnDutyFallback: boolean;
  };
}

export interface ChatbotStarterContext {
  welcomeMessage: string;
  suggestions: ChatSuggestion[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  suggestions?: ChatSuggestion[];
}
