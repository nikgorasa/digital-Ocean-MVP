import { AIProvider, AIProviderConfig, AICompletionRequest, AICompletionResponse } from "./types";

export class GeminiProvider implements AIProvider {
  name = "gemini";
  private apiKey: string;
  private model: string;

  constructor(config: AIProviderConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || "gemini-2.0-flash";
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const { messages, temperature = 0.7, maxTokens = 2048 } = request;

    const systemMessage = messages.find((m) => m.role === "system");
    const conversationMessages = messages.filter((m) => m.role !== "system");

    const contents = conversationMessages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    };

    if (systemMessage) {
      body.systemInstruction = {
        parts: [{ text: systemMessage.content }],
      };
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return {
      content,
      model: this.model,
      usage: data.usageMetadata
        ? {
            promptTokens: data.usageMetadata.promptTokenCount || 0,
            completionTokens: data.usageMetadata.candidatesTokenCount || 0,
            totalTokens: data.usageMetadata.totalTokenCount || 0,
          }
        : undefined,
    };
  }
}
