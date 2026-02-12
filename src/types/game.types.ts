// ============================================
// DESENROLA - Game Types
// ============================================

/**
 * Tiers de qualidade da resposta
 * D = ruim, C = fraco, B = bom, A = insano
 */
export type ResponseTier = 'A' | 'B' | 'C' | 'D';

/**
 * Status da rodada
 */
export type RoundStatus = 'pending' | 'playing' | 'completed';

/**
 * Resultado da rodada
 */
export type RoundResult = 'win' | 'loss' | null;

/**
 * Tipo de resposta do usuário
 */
export type ResponseType = 'typed' | 'ai_suggestion';

/**
 * Nivel de dificuldade da persona/round
 */
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

/**
 * Mecanica de selecao de cada round
 */
export type RoundMechanic = 'roulette' | 'cards' | 'direct';

/**
 * Mensagem do chat
 */
export interface ChatMessage {
  id: string;
  sender: 'user' | 'persona';
  content: string;
  time?: string; // Horario da mensagem (ex: "22:41")
  isLastMessage?: boolean;
}

/**
 * Persona (a mulher do chat)
 */
export interface Persona {
  id: string;
  name: string;
  age: number;
  bio: string;
  image?: string;
  context: string;
  storyImage?: string;
  storyText?: string;
  difficulty: Difficulty;
}

/**
 * Sugestão da IA
 */
export interface AISuggestion {
  id: string;
  content: string;
  tier: ResponseTier;
}

/**
 * Dados de uma rodada
 */
export interface Round {
  id: number;
  persona: Persona;
  chat: ChatMessage[];
  status: RoundStatus;
  result: RoundResult;
  userResponse: string | null;
  responseType: ResponseType | null;
  responseTier: ResponseTier | null;
  usedAI: boolean;
}

/**
 * Estado do jogo
 */
export interface GameState {
  currentRound: number;
  rounds: Round[];
  playerScore: number;
  opponentScore: number;
  isGameOver: boolean;
  hasWon: boolean | null;
  roundResults: Record<number, boolean>;
  selectedPersonas: Record<number, PersonaData>;
}

/**
 * Dados completos de uma persona (persona + chat + sugestoes)
 */
export interface PersonaData {
  persona: Persona;
  chat: ChatMessage[];
  aiSuggestions: AISuggestion[];
}

/**
 * Configuracao visual/mecanica de cada round
 */
export interface RoundConfig {
  id: number;
  mechanic: RoundMechanic;
  difficulty: Difficulty;
  label: string;
  emoji: string;
  description: string;
}

/**
 * Feedback visual baseado no tier
 */
export interface TierFeedback {
  tier: ResponseTier;
  message: string;
  color: string;
  bgColor: string;
}

/**
 * Dados da raspadinha
 */
export interface ScratchCardData {
  isScratched: boolean;
  prize: string;
  daysFreeTrial: number;
}

/**
 * Dados do checkout
 */
export interface CheckoutData {
  email: string;
  trialDays: number;
  isProcessing: boolean;
  isCompleted: boolean;
}

/**
 * Analytics events
 */
/**
 * Tom das sugestões da IA
 */
export type SuggestionTone = 'casual' | 'flirty' | 'funny' | 'curious' | 'rescue' | 'bold';

export type AnalyticsEvent =
  | 'funnel_started'
  | 'round_started'
  | 'round_completed'
  | 'ai_suggestion_viewed'
  | 'ai_suggestion_used'
  | 'typed_response'
  | 'game_completed'
  | 'scratch_card_revealed'
  | 'checkout_started'
  | 'checkout_completed';
