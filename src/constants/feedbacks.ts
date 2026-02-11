// ============================================
// DESENROLA - Feedbacks por Tier
// ============================================

import type { ResponseTier, TierFeedback } from '@/types';

/**
 * Feedbacks do Tier D (ruim / vermelho)
 */
export const TIER_D_FEEDBACKS: string[] = [
  'ELA VAI TE BLOQUEAR',
  'CRINGE DETECTADO',
  'VOCÊ SE AUTO-SABOTOU',
  'ISSO NÃO FUNCIONA',
  'PERDEU A MÃO',
];

/**
 * Feedbacks do Tier C (fraco / laranja)
 */
export const TIER_C_FEEDBACKS: string[] = [
  'MORREU A CONVERSA',
  'RESPOSTA SEM SAL',
  'NÃO CRIOU TENSÃO',
  'FICOU MORNO',
  'GENÉRICO DEMAIS',
];

/**
 * Feedbacks do Tier B (bom / verde)
 * AJUSTADO: Feedbacks neutros, sem premiar demais
 */
export const TIER_B_FEEDBACKS: string[] = [
  'SEGUIU O RITMO',
  'OK, MANTEVE A CONVERSA',
  'ACIMA DA MÉDIA',
  'PROGREDIU SEM ERRO',
];

/**
 * Feedbacks do Tier A (insano / roxo/dourado)
 */
export const TIER_A_FEEDBACKS: string[] = [
  'MOVIMENTO DE MESTRE',
  'ELA SENTIU A PRESSÃO',
  'TIMING PERFEITO',
  'INTELIGÊNCIA SOCIAL ALTA',
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
 * Configuração visual por tier
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
 * Retorna um feedback aleatório para o tier
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
 * Determina se o usuário vence a rodada baseado no tier
 * A e B = vitória, C e D = derrota
 */
export function isWinningTier(tier: ResponseTier): boolean {
  return tier === 'A' || tier === 'B';
}
