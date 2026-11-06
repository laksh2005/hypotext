// Known AI crawlers and agents, matched against the User-Agent header.
// Order matters only for naming: the first match wins.
export type BotInfo = { name: string; owner: string; kind: "training" | "search" | "assistant" };

const BOTS: { pattern: RegExp; info: BotInfo }[] = [
  { pattern: /GPTBot/i, info: { name: "GPTBot", owner: "OpenAI", kind: "training" } },
  { pattern: /OAI-SearchBot/i, info: { name: "OAI-SearchBot", owner: "OpenAI", kind: "search" } },
  { pattern: /ChatGPT-User/i, info: { name: "ChatGPT-User", owner: "OpenAI", kind: "assistant" } },
  { pattern: /ClaudeBot/i, info: { name: "ClaudeBot", owner: "Anthropic", kind: "training" } },
  { pattern: /Claude-User/i, info: { name: "Claude-User", owner: "Anthropic", kind: "assistant" } },
  { pattern: /Claude-SearchBot/i, info: { name: "Claude-SearchBot", owner: "Anthropic", kind: "search" } },
  { pattern: /anthropic-ai/i, info: { name: "anthropic-ai", owner: "Anthropic", kind: "training" } },
  { pattern: /PerplexityBot/i, info: { name: "PerplexityBot", owner: "Perplexity", kind: "search" } },
  { pattern: /Perplexity-User/i, info: { name: "Perplexity-User", owner: "Perplexity", kind: "assistant" } },
  { pattern: /Google-Extended/i, info: { name: "Google-Extended", owner: "Google", kind: "training" } },
  { pattern: /GoogleOther/i, info: { name: "GoogleOther", owner: "Google", kind: "training" } },
  { pattern: /Applebot-Extended/i, info: { name: "Applebot-Extended", owner: "Apple", kind: "training" } },
  { pattern: /meta-externalagent/i, info: { name: "Meta-ExternalAgent", owner: "Meta", kind: "training" } },
  { pattern: /Bytespider/i, info: { name: "Bytespider", owner: "ByteDance", kind: "training" } },
  { pattern: /Amazonbot/i, info: { name: "Amazonbot", owner: "Amazon", kind: "assistant" } },
  { pattern: /cohere-ai/i, info: { name: "cohere-ai", owner: "Cohere", kind: "training" } },
  { pattern: /MistralAI-User/i, info: { name: "MistralAI-User", owner: "Mistral", kind: "assistant" } },
  { pattern: /YouBot/i, info: { name: "YouBot", owner: "You.com", kind: "search" } },
  { pattern: /DuckAssistBot/i, info: { name: "DuckAssistBot", owner: "DuckDuckGo", kind: "assistant" } },
  { pattern: /CCBot/i, info: { name: "CCBot", owner: "Common Crawl", kind: "training" } },
];

export const KNOWN_BOTS = BOTS.map((b) => b.info);

export function detectBot(userAgent: string | null | undefined): BotInfo | null {
  if (!userAgent) return null;
  for (const b of BOTS) if (b.pattern.test(userAgent)) return b.info;
  return null;
}
