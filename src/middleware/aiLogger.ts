import { AILogEntry } from "@/types/ai";

export function logAIDecision(entry: AILogEntry) {
  console.log(`[AI:${entry.agent}] (${entry.timestamp})`, entry.decision);
  // Optional: POST to your /api/ai-log endpoint or push to DB
}
