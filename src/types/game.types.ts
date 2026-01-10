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
 * Mensagem do chat
 */
export interface ChatMessage {
  id: string;
  sender: 'user' | 'persona';
  content: string;
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
