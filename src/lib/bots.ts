// Known AI crawlers and agents, matched against the User-Agent header.
// Order matters only for naming: the first match wins.
export type BotInfo = { name: string; owner: string };

const BOTS: { pattern: RegExp; info: BotInfo }[] = [
  { pattern: /GPTBot/i, info: { name: "GPTBot", owner: "OpenAI" } },
  { pattern: /OAI-SearchBot/i, info: { name: "OAI-SearchBot", owner: "OpenAI" } },
  { pattern: /ChatGPT-User/i, info: { name: "ChatGPT-User", owner: "OpenAI" } },
  { pattern: /ClaudeBot/i, info: { name: "ClaudeBot", owner: "Anthropic" } },
  { pattern: /Claude-User/i, info: { name: "Claude-User", owner: "Anthropic" } },
  { pattern: /Claude-SearchBot/i, info: { name: "Claude-SearchBot", owner: "Anthropic" } },
  { pattern: /anthropic-ai/i, info: { name: "anthropic-ai", owner: "Anthropic" } },
  { pattern: /PerplexityBot/i, info: { name: "PerplexityBot", owner: "Perplexity" } },
  { pattern: /Perplexity-User/i, info: { name: "Perplexity-User", owner: "Perplexity" } },
  { pattern: /Google-Extended/i, info: { name: "Google-Extended", owner: "Google" } },
  { pattern: /GoogleOther/i, info: { name: "GoogleOther", owner: "Google" } },
  { pattern: /Applebot-Extended/i, info: { name: "Applebot-Extended", owner: "Apple" } },
  { pattern: /meta-externalagent/i, info: { name: "Meta-ExternalAgent", owner: "Meta" } },
  { pattern: /Bytespider/i, info: { name: "Bytespider", owner: "ByteDance" } },
  { pattern: /Amazonbot/i, info: { name: "Amazonbot", owner: "Amazon" } },
  { pattern: /cohere-ai/i, info: { name: "cohere-ai", owner: "Cohere" } },
  { pattern: /MistralAI-User/i, info: { name: "MistralAI-User", owner: "Mistral" } },
  { pattern: /YouBot/i, info: { name: "YouBot", owner: "You.com" } },
  { pattern: /DuckAssistBot/i, info: { name: "DuckAssistBot", owner: "DuckDuckGo" } },
  { pattern: /CCBot/i, info: { name: "CCBot", owner: "Common Crawl" } },
];

export const KNOWN_BOTS = BOTS.map((b) => b.info);

export function detectBot(userAgent: string | null | undefined): BotInfo | null {
  if (!userAgent) return null;
  for (const b of BOTS) if (b.pattern.test(userAgent)) return b.info;
  return null;
}
