import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// ============================================
// API Route: /api/suggest
// Gera novas sugestões de resposta usando GPT
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
}

const SYSTEM_PROMPT = `Você é um especialista em comunicação e paquera masculina. Sua tarefa é gerar 3 respostas prontas que o usuário pode usar para responder a última mensagem da conversa.

REGRAS:
1. Gere EXATAMENTE 3 respostas diferentes
2. Todas devem ser Tier A — alta inteligência social, timing perfeito, criam tensão positiva
3. As respostas devem considerar: perfil da pessoa, contexto da conversa, e o que foi dito antes
4. Cada resposta deve ter um estilo diferente:
   - Resposta 1: confiante e provocativa
   - Resposta 2: inteligente e observadora
   - Resposta 3: direta e magnética
5. NUNCA seja sexual, creepy, desesperado ou desrespeitoso
6. As respostas devem soar naturais, como um cara confiante falaria no WhatsApp/Tinder
7. Máximo de 2 linhas por resposta
8. Use linguagem informal brasileira (sem gírias forçadas)

Responda APENAS com JSON válido no formato:
{
  "suggestions": [
    { "content": "resposta 1" },
    { "content": "resposta 2" },
    { "content": "resposta 3" }
  ]
}`;

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
    } = body;

    const chatText = chatHistory
      .map((msg) => `${msg.sender === 'user' ? 'Você' : personaName}: ${msg.content}`)
      .join('\n');

    const lastMessage = chatHistory.filter(m => m.sender !== 'user').pop();

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
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 500,
    });

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

        return NextResponse.json({ suggestions });
      }
      throw new Error('No JSON found');
    } catch {
      return NextResponse.json(
        { error: 'Falha ao processar resposta da IA', suggestions: [] },
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
