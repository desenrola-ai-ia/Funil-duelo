import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { logApiCost } from '@/lib/api-cost-logger';
import type { SuggestionTone } from '@/types';

// ============================================
// API Route: /api/suggest
// Gera sugestões de resposta com tom selecionável
// ============================================

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface SuggestRequest {
  personaName: string;
  personaAge: number;
  personaBio: string;
  context: string;
  chatHistory: { sender: string; content: string }[];
  roundNumber?: number;
  tone?: SuggestionTone;
  length?: 'short' | 'normal';
  useEmoji?: boolean;
}

// ============================================
// TONE DEFINITIONS
// ============================================

const TONE_PROMPTS: Record<SuggestionTone, string> = {
  casual: 'Leve e descontraído. Sem pressão, conversa fluida e natural. Energia de quem tá de boa.',
  flirty: 'Provocativo e inteligente. Cria tensão positiva com provocações sutis, faz ela querer responder. Confiante sem ser arrogante.',
  funny: 'Foco no humor. Ironia leve, piada situacional, referências engraçadas. Leve e divertido, faz ela rir.',
  curious: 'Mostra interesse genuíno. Perguntas inteligentes que aprofundam a conexão. Faz ela sentir que você realmente quer conhecer ela.',
  rescue: 'Reaproximação. A conversa esfriou ou ela parou de responder. Reengajar de forma natural sem parecer carente ou desesperado.',
  bold: 'Direto ao ponto. Pedir número, marcar encontro, mover pra próxima etapa. Confiante e objetivo, sem rodeio.',
};

// ============================================
// SYSTEM PROMPT BUILDER
// ============================================

function buildSystemPrompt(tone: SuggestionTone, length: 'short' | 'normal', useEmoji: boolean): string {
  const toneDesc = TONE_PROMPTS[tone];
  const lengthRule = length === 'short'
    ? 'Máximo de 1 linha por resposta. Respostas curtas e diretas.'
    : 'Máximo de 2 linhas por resposta.';
  const emojiRule = useEmoji
    ? ''
    : '\n9. NÃO use emojis nas respostas. Zero emojis.';

  return `Você é um especialista em comunicação e paquera masculina. Sua tarefa é gerar 3 respostas prontas que o usuário pode usar para responder a última mensagem da conversa.

TOM SELECIONADO: ${toneDesc}

REGRAS:
1. Gere EXATAMENTE 3 respostas diferentes
2. Todas devem ser Tier A — alta inteligência social, timing perfeito
3. As respostas devem considerar: perfil da pessoa, contexto da conversa, e o que foi dito antes
4. Todas as 3 respostas devem seguir o tom descrito acima. Varie a abordagem mas mantenha o mesmo tom.
5. NUNCA seja sexual, creepy, desesperado ou desrespeitoso
6. As respostas devem soar naturais, como um cara confiante falaria no WhatsApp/Tinder
7. ${lengthRule}
8. Use linguagem informal brasileira (sem gírias forçadas)${emojiRule}

Responda APENAS com JSON válido no formato:
{
  "suggestions": [
    { "content": "resposta 1" },
    { "content": "resposta 2" },
    { "content": "resposta 3" }
  ]
}`;
}

// ============================================
// TONE RECOMMENDATION (deterministic, no AI)
// ============================================

function getRecommendedTone(
  roundNumber: number,
  chatHistory: { sender: string; content: string }[]
): SuggestionTone {
  const lastPersonaMsg = chatHistory.filter(m => m.sender !== 'user').pop();
  const content = lastPersonaMsg?.content?.toLowerCase() || '';

  // Se a última mensagem dela é uma pergunta → "curious"
  if (content.includes('?')) return 'curious';

  // Baseado no round/rapport level
  if (roundNumber === 1) return 'casual';
  if (roundNumber === 2) return 'flirty';
  return 'bold';
}

// ============================================
// MAIN HANDLER
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body: SuggestRequest = await request.json();

    const {
      personaName,
      personaAge,
      personaBio,
      context,
      chatHistory,
      roundNumber = 1,
      tone = 'casual',
      length = 'normal',
      useEmoji = true,
    } = body;

    const chatText = chatHistory
      .map((msg) => `${msg.sender === 'user' ? 'Você' : personaName}: ${msg.content}`)
      .join('\n');

    const lastMessage = chatHistory.filter(m => m.sender !== 'user').pop();

    const recommendedTone = getRecommendedTone(roundNumber, chatHistory);
    const systemPrompt = buildSystemPrompt(tone, length, useEmoji);

    const userPrompt = `INFORMAÇÕES:
- Round: ${roundNumber} de 3
- Persona: ${personaName}, ${personaAge} anos
- Bio: "${personaBio}"
- Situação: ${context}

CONVERSA ATÉ AGORA:
${chatText}

ÚLTIMA MENSAGEM DELA:
"${lastMessage?.content || ''}"

Gere 3 respostas Tier A para o usuário enviar agora. Considere todo o contexto acima.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 500,
    });

    // Log cost (fire-and-forget)
    if (completion.usage) {
      logApiCost('suggest', 'gpt-4o-mini', completion.usage);
    }

    const responseText = completion.choices[0]?.message?.content || '';

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const suggestions = (parsed.suggestions || []).slice(0, 3).map(
          (s: { content: string }, i: number) => ({
            id: `ai-gen-${Date.now()}-${i}`,
            content: s.content,
            tier: 'A' as const,
          })
        );

        return NextResponse.json({ suggestions, recommendedTone });
      }
      throw new Error('No JSON found');
    } catch {
      return NextResponse.json(
        { error: 'Falha ao processar resposta da IA', suggestions: [], recommendedTone },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar sugestões', suggestions: [] },
      { status: 500 }
    );
  }
}
