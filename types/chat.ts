export interface SessionData {
  id: string;
  title?: string;
  messages: ChatMessage[];
  createdAt?: Date;
  updatedAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  tokens?: {
    input?: number;
    output?: number;
  };
  cost?: number;
  metadata?: Record<string, unknown>;
}

export interface ChatMetrics {
  totalTokens: number;
  totalCost: number;
  messageCount: number;
  averageResponseTime?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  metrics: ChatMetrics;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  visibility: 'private' | 'public';
}