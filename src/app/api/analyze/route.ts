import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// ============================================
// API Route: /api/analyze
// Analisa a resposta do usuario usando GPT
// Com guardrails para evitar falsos positivos
// ============================================

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================
// TYPES
// ============================================

interface AnalyzeRequest {
  personaName: string;
  personaAge: number;
  personaBio: string;
  context: string;
  chatHistory: { sender: string; content: string }[];
  userResponse: string;
  roundNumber?: number;
}

interface SafetyFlags {
  sexual_too_early: boolean;
  disrespect_or_insult: boolean;
  too_intimate_no_rapport: boolean;
  pushy_or_creepy: boolean;
  off_context: boolean;
}

type RapportLevel = 'low' | 'mid' | 'high';
type Tier = 'A' | 'B' | 'C' | 'D';

interface AnalyzeResponse {
  tier: Tier;
  reason: string;
  flags: SafetyFlags;
  rapport_level: RapportLevel;
}

// ============================================
// PROMPT COM 2 CAMADAS: FLAGS + TIER
// ============================================

const SYSTEM_PROMPT = `Você é um avaliador rigoroso de mensagens em conversa inicial de paquera.

Você deve fazer 2 passos:

PASSO 1 — SAFETY / TIMING FLAGS (REGRAS DURAS)
Marque flags booleanas sobre a resposta do usuário, considerando o nível de rapport:
- rapport_level=low: conversa inicial, zero intimidade, primeira troca de mensagens.
- rapport_level=mid: já houve troca confortável, mas ainda não há liberdade total.
- rapport_level=high: já existe flerte mútuo estabelecido e mais liberdade.

Definições das flags:
- sexual_too_early: sexualização direta/explícita ou objetificação (ex: "gostosa", "delícia", "quero te comer", "manda nude", "que corpo", comentários sobre partes do corpo, etc.) quando rapport_level é low ou mid.
- disrespect_or_insult: xingamentos, agressividade, humilhação, ofensas diretas ou indiretas.
- too_intimate_no_rapport: intimidade forçada cedo (ex: apelidos íntimos como "amor", "bb", "minha", possessividade, "vem dormir comigo", "quero acordar do seu lado" no início).
- pushy_or_creepy: pressão, insistência excessiva, invasivo, carente demais, energia creepy, pedir encontro/número muito rápido.
- off_context: não responde ao que foi dito, ignora a pergunta dela, quebra completamente a situação.

PASSO 2 — TIER
Depois de marcar flags, dê um tier A/B/C/D:
- Tier A: alta inteligência social, timing perfeito, cria tensão positiva sem forçar, resposta que faz ela querer continuar.
- Tier B: bom, mantém a vibe, progride sem erro grave, mostra personalidade.
- Tier C: fraco, genérico, sem tensão, "oi tudo bem", respostas mornas.
- Tier D: cringe, desrespeitoso, sexual precoce, intimidade forçada, creepy, ou completamente fora de contexto.

REGRAS CRÍTICAS (NUNCA VIOLAR):
1. Se rapport_level = low E sexual_too_early = true → tier DEVE ser D (obrigatório)
2. Se rapport_level = low E too_intimate_no_rapport = true → tier DEVE ser D
3. Se disrespect_or_insult = true → tier DEVE ser D (sempre)
4. Se pushy_or_creepy = true → tier deve ser C ou D (D quando forte)
5. Se off_context = true → tier deve ser C ou D

IMPORTANTE: Seja RIGOROSO. A maioria das respostas de homens são C ou D. Tier A é RARO. Tier B é para respostas genuinamente boas.

Responda APENAS com JSON válido:
{
  "tier": "A|B|C|D",
  "reason": "explicação curta de 1 linha",
  "flags": {
    "sexual_too_early": true|false,
    "disrespect_or_insult": true|false,
    "too_intimate_no_rapport": true|false,
    "pushy_or_creepy": true|false,
    "off_context": true|false
  },
  "rapport_level": "low|mid|high"
}`;

// ============================================
// HELPER: Determina rapport_level pelo round
// ============================================

function getRapportLevel(roundNumber: number): RapportLevel {
  switch (roundNumber) {
    case 1:
      return 'low';
    case 2:
      return 'mid';
    case 3:
      return 'high';
    default:
      return 'low';
  }
}

// ============================================
// HELPER: Guardrail determinístico
// ============================================

function applyGuardrails(result: AnalyzeResponse): AnalyzeResponse {
  const { flags, rapport_level } = result;
  let { tier } = result;

  // REGRA 1: Sexualização precoce em rapport baixo = SEMPRE D
  if (rapport_level === 'low' && flags.sexual_too_early) {
    tier = 'D';
  }

  // REGRA 2: Sexualização em rapport médio = mínimo C
  if (rapport_level === 'mid' && flags.sexual_too_early && (tier === 'A' || tier === 'B')) {
    tier = 'C';
  }

  // REGRA 3: Desrespeito/insulto = SEMPRE D
  if (flags.disrespect_or_insult) {
    tier = 'D';
  }

  // REGRA 4: Intimidade forçada em rapport baixo = SEMPRE D
  if (rapport_level === 'low' && flags.too_intimate_no_rapport) {
    tier = 'D';
  }

  // REGRA 5: Creepy/pushy = mínimo C
  if (flags.pushy_or_creepy && (tier === 'A' || tier === 'B')) {
    tier = 'C';
  }

  // REGRA 6: Fora de contexto = mínimo C
  if (flags.off_context && (tier === 'A' || tier === 'B')) {
    tier = 'C';
  }

  return { ...result, tier };
}

// ============================================
// HELPER: Parse seguro do JSON
// ============================================

function parseGPTResponse(responseText: string, rapportLevel: RapportLevel): AnalyzeResponse {
  const defaultFlags: SafetyFlags = {
    sexual_too_early: false,
    disrespect_or_insult: false,
    too_intimate_no_rapport: false,
    pushy_or_creepy: false,
    off_context: false,
  };

  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      const validTiers: Tier[] = ['A', 'B', 'C', 'D'];
      const tier: Tier = validTiers.includes(parsed.tier?.toUpperCase()) 
        ? parsed.tier.toUpperCase() 
        : 'C';

      const flags: SafetyFlags = {
        sexual_too_early: Boolean(parsed.flags?.sexual_too_early),
        disrespect_or_insult: Boolean(parsed.flags?.disrespect_or_insult),
        too_intimate_no_rapport: Boolean(parsed.flags?.too_intimate_no_rapport),
        pushy_or_creepy: Boolean(parsed.flags?.pushy_or_creepy),
        off_context: Boolean(parsed.flags?.off_context),
      };

      const validRapport: RapportLevel[] = ['low', 'mid', 'high'];
      const rapport_level: RapportLevel = validRapport.includes(parsed.rapport_level)
        ? parsed.rapport_level
        : rapportLevel;

      return {
        tier,
        reason: parsed.reason || 'Avaliação concluída',
        flags,
        rapport_level,
      };
    }
    throw new Error('No JSON found');
  } catch {
    const tierMatch = responseText.match(/[Tt]ier\s*[:\s]*([ABCD])/i);
    const tier = (tierMatch?.[1]?.toUpperCase() || 'C') as Tier;
    
    return {
      tier,
      reason: 'Resposta avaliada automaticamente',
      flags: defaultFlags,
      rapport_level: rapportLevel,
    };
  }
}

// ============================================
// MAIN HANDLER
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();

    const { 
      personaName, 
      personaAge, 
      personaBio, 
      context, 
      chatHistory, 
      userResponse,
      roundNumber = 1 
    } = body;

    const rapportLevel = getRapportLevel(roundNumber);

    const chatText = chatHistory
      .map((msg) => `${msg.sender === 'user' ? 'Você' : personaName}: ${msg.content}`)
      .join('\n');

    const userPrompt = `INFORMAÇÕES DO CONTEXTO:
- Round: ${roundNumber} de 3
- Rapport Level: ${rapportLevel} (${rapportLevel === 'low' ? 'conversa inicial, zero intimidade' : rapportLevel === 'mid' ? 'já houve troca, mas sem liberdade total' : 'flerte mútuo estabelecido'})
- Persona: ${personaName}, ${personaAge} anos
- Bio dela: "${personaBio}"
- Situação: ${context}

HISTÓRICO DA CONVERSA:
${chatText}

RESPOSTA DO USUÁRIO PARA AVALIAR:
"${userResponse}"

Analise a resposta considerando o rapport_level=${rapportLevel}. Marque as flags de segurança e dê o tier apropriado.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 300,
    });

    const responseText = completion.choices[0]?.message?.content || '';

    let result = parseGPTResponse(responseText, rapportLevel);
    result = applyGuardrails(result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error analyzing response:', error);

    // FALLBACK: NUNCA retornar Tier B no erro
    const random = Math.random();
    const fallbackTier: Tier = random < 0.3 ? 'C' : 'D';

    return NextResponse.json({
      tier: fallbackTier,
      reason: 'Erro na análise, tier atribuído por fallback',
      flags: {
        sexual_too_early: false,
        disrespect_or_insult: false,
        too_intimate_no_rapport: false,
        pushy_or_creepy: false,
        off_context: false,
      },
      rapport_level: 'low',
    } as AnalyzeResponse);
  }
}
