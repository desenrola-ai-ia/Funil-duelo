// ============================================
// DESENROLA - Personas e Chats das Rodadas
// ============================================

import type { Persona, ChatMessage, AISuggestion } from '@/types';

// ============================================
// RODADA 1 - Lara
// ============================================

export const PERSONA_LARA: Persona = {
  id: 'lara',
  name: 'Lara',
  age: 24,
  bio: 'SP - cafe forte - ironia fraca nao passa',
  context: 'Voce conheceu ela num role ha 1 semana. Hoje ela curtiu um story seu.',
};

export const CHAT_LARA: ChatMessage[] = [
  {
    id: 'lara-1',
    sender: 'user',
    content: 'Acho que eu te vi no role do sabado... ou to viajando?',
  },
  {
    id: 'lara-2',
    sender: 'persona',
    content: 'viu sim kkk voce tava com cara de quem sumiu do nada',
  },
  {
    id: 'lara-3',
    sender: 'user',
    content: 'eu sumi pq achei que ia dar ruim',
  },
  {
    id: 'lara-4',
    sender: 'persona',
    content: 'medroso?',
  },
  {
    id: 'lara-5',
    sender: 'user',
    content: 'depende do tipo de "ruim"',
  },
  {
    id: 'lara-6',
    sender: 'persona',
    content: 'kkkk entendi...',
  },
  {
    id: 'lara-7',
    sender: 'persona',
    content: 'Ta... e por que eu deveria te responder agora?',
    isLastMessage: true,
  },
];

export const AI_SUGGESTIONS_LARA: AISuggestion[] = [
  {
    id: 'lara-ai-1',
    content: 'Nao deveria. Mas ta aqui ainda, ne?',
    tier: 'A',
  },
  {
    id: 'lara-ai-2',
    content: 'Porque voce tambem ficou curiosa',
    tier: 'B',
  },
  {
    id: 'lara-ai-3',
    content: 'Pra matar sua curiosidade ue',
    tier: 'B',
  },
];

// ============================================
// RODADA 2 - Camila
// ============================================

export const PERSONA_CAMILA: Persona = {
  id: 'camila',
  name: 'Camila',
  age: 28,
  bio: 'Trampo > tudo - vinho as vezes - sem tempo pra joguinho',
  context: 'Voces deram match ontem. Ela sumiu e voltou hoje.',
};

export const CHAT_CAMILA: ChatMessage[] = [
  {
    id: 'camila-1',
    sender: 'user',
    content: 'Voce parece ser daquelas que some quando ta na correria',
  },
  {
    id: 'camila-2',
    sender: 'persona',
    content: 'eu sou. semana lotada.',
  },
  {
    id: 'camila-3',
    sender: 'user',
    content: 'justo. eu curto gente focada.',
  },
  {
    id: 'camila-4',
    sender: 'persona',
    content: 'focada ≠ disponivel',
  },
  {
    id: 'camila-5',
    sender: 'user',
    content: 'perfeito. eu tambem nao sou sempre',
  },
  {
    id: 'camila-6',
    sender: 'persona',
    content: 'ok, entao sem drama',
  },
  {
    id: 'camila-7',
    sender: 'persona',
    content: 'Qual e sua intencao aqui? sem enrolar.',
    isLastMessage: true,
  },
];

export const AI_SUGGESTIONS_CAMILA: AISuggestion[] = [
  {
    id: 'camila-ai-1',
    content: 'Te conhecer sem pressa. Se rolar, a gente descobre junto.',
    tier: 'A',
  },
  {
    id: 'camila-ai-2',
    content: 'Tomar um vinho e ver se a conversa flui ao vivo',
    tier: 'B',
  },
  {
    id: 'camila-ai-3',
    content: 'Trocar ideia com alguem interessante. Voce parece ser.',
    tier: 'B',
  },
];

// ============================================
// RODADA 3 - Bia
// ============================================

export const PERSONA_BIA: Persona = {
  id: 'bia',
  name: 'Bia',
  age: 22,
  bio: 'nao sou facil de ler',
  context: 'Voces ja ficaram 1 vez numa festa. Desde entao, nao se falam direito.',
};

export const CHAT_BIA: ChatMessage[] = [
  {
    id: 'bia-1',
    sender: 'user',
    content: 'Voce sumiu depois daquela festa',
  },
  {
    id: 'bia-2',
    sender: 'persona',
    content: 'e voce sentiu falta?',
  },
  {
    id: 'bia-3',
    sender: 'user',
    content: 'eu fiquei curioso',
  },
  {
    id: 'bia-4',
    sender: 'persona',
    content: 'curioso e perigoso',
  },
  {
    id: 'bia-5',
    sender: 'user',
    content: 'depende... pra quem',
  },
  {
    id: 'bia-6',
    sender: 'persona',
    content: 'pra mim talvez.',
  },
  {
    id: 'bia-7',
    sender: 'persona',
    content: 'Entao fala... voce e bom mesmo ou so faz pose?',
    isLastMessage: true,
  },
];

export const AI_SUGGESTIONS_BIA: AISuggestion[] = [
  {
    id: 'bia-ai-1',
    content: 'Pose eu deixo pra foto. Ao vivo eu prefiro provar.',
    tier: 'A',
  },
  {
    id: 'bia-ai-2',
    content: 'Isso voce so descobre se der uma segunda chance',
    tier: 'B',
  },
  {
    id: 'bia-ai-3',
    content: 'Boa pergunta. Mas quem tem que descobrir e voce.',
    tier: 'B',
  },
];

// ============================================
// DADOS COMPLETOS DAS RODADAS
// ============================================

export interface RoundData {
  persona: Persona;
  chat: ChatMessage[];
  aiSuggestions: AISuggestion[];
}

export const ROUNDS_DATA: RoundData[] = [
  {
    persona: PERSONA_LARA,
    chat: CHAT_LARA,
    aiSuggestions: AI_SUGGESTIONS_LARA,
  },
  {
    persona: PERSONA_CAMILA,
    chat: CHAT_CAMILA,
    aiSuggestions: AI_SUGGESTIONS_CAMILA,
  },
  {
    persona: PERSONA_BIA,
    chat: CHAT_BIA,
    aiSuggestions: AI_SUGGESTIONS_BIA,
  },
];

/**
 * Retorna os dados de uma rodada especifica (1, 2 ou 3)
 */
export function getRoundData(roundNumber: number): RoundData {
  const index = roundNumber - 1;
  if (index < 0 || index >= ROUNDS_DATA.length) {
    throw new Error(`Rodada invalida: ${roundNumber}`);
  }
  return ROUNDS_DATA[index];
}
