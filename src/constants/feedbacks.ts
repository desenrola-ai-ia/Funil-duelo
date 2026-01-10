// ============================================
// DESENROLA - Feedbacks por Tier
// ============================================

import type { ResponseTier, TierFeedback } from '@/types';

/**
 * Feedbacks do Tier D (ruim / vermelho)
 */
export const TIER_D_FEEDBACKS: string[] = [
  'ELA VAI TE BLOQUEAR',
  'CRINGE MAXIMO',
  'VOCE SE AUTO-SABOTOU',
  'ELA JA PERDEU O TESAO',
];

/**
 * Feedbacks do Tier C (fraco / laranja)
 */
export const TIER_C_FEEDBACKS: string[] = [
  'MORREU A CONVERSA',
  'RESPOSTA SEM SAL',
  'NAO CRIOU TENSAO',
  'FICOU "AMIGO" DEMAIS',
];

/**
 * Feedbacks do Tier B (bom / verde)
 */
export const TIER_B_FEEDBACKS: string[] = [
  'ELA TE DEU MORAL',
  'BOA, VOCE MANTEVE A VIBE',
  'RESPOSTA ACIMA DA MEDIA',
  'VOCE NAO ESTRAGOU (isso e raro)',
];

/**
 * Feedbacks do Tier A (insano / roxo/dourado)
 */
export const TIER_A_FEEDBACKS: string[] = [
  'ESSA FEZ ELA PINGAR',
  'MOVIMENTO DE MESTRE',
  'ELA SENTIU A PRESSAO',
  'VOCE JOGOU NO HARD MODE E GANHOU',
];

/**
 * Mapa de feedbacks por tier
 */
export const FEEDBACKS_BY_TIER: Record<ResponseTier, string[]> = {
  A: TIER_A_FEEDBACKS,
  B: TIER_B_FEEDBACKS,
  C: TIER_C_FEEDBACKS,
  D: TIER_D_FEEDBACKS,
};

/**
 * Configuracao visual por tier
 */
export const TIER_CONFIG: Record<ResponseTier, Omit<TierFeedback, 'message'>> = {
  A: {
    tier: 'A',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
  },
  B: {
    tier: 'B',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
  },
  C: {
    tier: 'C',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
  },
  D: {
    tier: 'D',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
  },
};

/**
 * Retorna um feedback aleatorio para o tier
 */
export function getRandomFeedback(tier: ResponseTier): TierFeedback {
  const feedbacks = FEEDBACKS_BY_TIER[tier];
  const randomIndex = Math.floor(Math.random() * feedbacks.length);
  const config = TIER_CONFIG[tier];

  return {
    ...config,
    message: feedbacks[randomIndex],
  };
}

/**
 * Determina se o usuario vence a rodada baseado no tier
 * A e B = vitoria, C e D = derrota
 */
export function isWinningTier(tier: ResponseTier): boolean {
  return tier === 'A' || tier === 'B';
}
