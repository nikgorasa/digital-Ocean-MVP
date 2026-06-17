import { AIProvider, AIProviderConfig, AICompletionRequest, AICompletionResponse } from "./types";

export class MiMoProvider implements AIProvider {
  name = "mimo";
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(config: AIProviderConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || "MiMo-7B-RL";
    this.baseUrl = config.baseUrl || "https://api.xiaomi.com/v1";
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const { messages, temperature = 0.7, maxTokens = 2048 } = request;

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`MiMo API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    return {
      content,
      model: this.model,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens || 0,
            completionTokens: data.usage.completion_tokens || 0,
            totalTokens: data.usage.total_tokens || 0,
          }
        : undefined,
    };
  }
}
