// ============================================
// DESENROLA - API Cost Logger
// Logs OpenAI API token usage to /data/api-costs.jsonl
// ============================================

import { appendFile } from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';

const COSTS_FILE = path.join(process.cwd(), 'data', 'api-costs.jsonl');

// gpt-4o-mini pricing (USD per token)
const PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o-mini': { input: 0.15 / 1_000_000, output: 0.60 / 1_000_000 },
};

export interface ApiCostEntry {
  timestamp: number;
  endpoint: 'analyze' | 'suggest';
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUSD: number;
}

export async function logApiCost(
  endpoint: 'analyze' | 'suggest',
  model: string,
  usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
) {
  try {
    const dir = path.dirname(COSTS_FILE);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    const pricing = PRICING[model] || PRICING['gpt-4o-mini'];
    const promptTokens = usage.prompt_tokens || 0;
    const completionTokens = usage.completion_tokens || 0;
    const costUSD = promptTokens * pricing.input + completionTokens * pricing.output;

    const entry: ApiCostEntry = {
      timestamp: Date.now(),
      endpoint,
      model,
      promptTokens,
      completionTokens,
      totalTokens: usage.total_tokens || promptTokens + completionTokens,
      costUSD,
    };

    await appendFile(COSTS_FILE, JSON.stringify(entry) + '\n');
  } catch {
    // Fire-and-forget — never block the API response
  }
}
