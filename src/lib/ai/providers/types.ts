export interface AIProviderConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AICompletionRequest {
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface AICompletionResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AIProvider {
  name: string;
  complete(request: AICompletionRequest): Promise<AICompletionResponse>;
}
