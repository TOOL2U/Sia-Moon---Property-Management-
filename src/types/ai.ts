export type AIRole = "COO" | "CFO";

export type AILogEntry = {
  timestamp: string;
  agent: AIRole;
  decision: string;
  confidence: number;
  source: "auto" | "manual";
  escalation?: boolean;
  notes?: string;
};

export type AIResponse<T> = {
  decision: T;
  confidence: number;
  logs: AILogEntry[];
  escalate: boolean;
};
