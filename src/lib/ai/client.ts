import { GeminiProvider } from "./providers/gemini";
import { OpenAIProvider } from "./providers/openai";
import { MiMoProvider } from "./providers/mimo";
import { AIProvider } from "./providers/types";

let cachedProvider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (cachedProvider) return cachedProvider;

  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const mimoKey = process.env.MIMO_API_KEY;

  if (geminiKey) {
    cachedProvider = new GeminiProvider({
      apiKey: geminiKey,
      model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
    });
    console.log("[AI] Using Gemini provider");
  } else if (openaiKey) {
    cachedProvider = new OpenAIProvider({
      apiKey: openaiKey,
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    });
    console.log("[AI] Using OpenAI provider");
  } else if (mimoKey) {
    cachedProvider = new MiMoProvider({
      apiKey: mimoKey,
      model: process.env.MIMO_MODEL || "MiMo-7B-RL",
    });
    console.log("[AI] Using MiMo provider");
  } else {
    throw new Error(
      "No AI provider configured. Set one of: GEMINI_API_KEY, OPENAI_API_KEY, or MOMO_API_KEY"
    );
  }

  return cachedProvider;
}

export async function generateAIResponse(
  systemPrompt: string,
  userMessage: string,
  history: { role: "user" | "assistant"; content: string }[] = []
): Promise<string> {
  const provider = getAIProvider();

  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user" as const, content: userMessage },
  ];

  const response = await provider.complete({
    messages,
    temperature: 0.7,
    maxTokens: 2048,
  });

  return response.content;
}
