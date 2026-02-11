export * from './feedbacks';
export * from './personas';

import type { RoundConfig } from '@/types';

// ============================================
// CONFIGURAÇÕES GERAIS DO JOGO
// ============================================

export const GAME_CONFIG = {
  /** Número total de rodadas */
  TOTAL_ROUNDS: 3,

  /** Dias de trial grátis */
  FREE_TRIAL_DAYS: 7,

  /** Nome do oponente */
  OPPONENT_NAME: 'Cara Médio',
} as const;

// ============================================
// CONFIGURAÇÕES DOS ROUNDS
// ============================================

export const ROUND_CONFIGS: RoundConfig[] = [
  {
    id: 1,
    mechanic: 'roulette',
    difficulty: 'EASY',
    label: 'Mina Fácil',
    emoji: '😌',
    description: 'Primeira rodada: mais tranquila.',
  },
  {
    id: 2,
    mechanic: 'cards',
    difficulty: 'MEDIUM',
    label: 'Menina Cú Doce',
    emoji: '😐',
    description: 'Agora o desafio é maior.',
  },
  {
    id: 3,
    mechanic: 'direct',
    difficulty: 'HARD',
    label: '10/10 Dificil!',
    emoji: '😈',
    description: 'Última rodada. Essa é a mais difícil.',
  },
];

/**
 * Retorna a configuração de um round específico
 */
export function getRoundConfig(roundNumber: number): RoundConfig {
  const config = ROUND_CONFIGS[roundNumber - 1];
  if (!config) {
    throw new Error(`Round inválido: ${roundNumber}`);
  }
  return config;
}

// ============================================
// ROTAS DO FUNIL
// ============================================

export const ROUTES = {
  HOME: '/',
  LANDING: '/landing',
  ROUND_1: '/round1',
  ROUND_2: '/round2',
  ROUND_3: '/round3',
  DUELO_ROUND: '/duelo/round',
  DUELO_RESULT: '/duelo/result',
  DUELO_REWARD: '/duelo/reward',
  CHECKOUT: '/checkout',
  ONBOARDING: '/onboarding',
} as const;

// ============================================
// TEXTOS DA UI
// ============================================

export const UI_TEXTS = {
  GAME_TITLE: 'Duelo de Lábia',
  GAME_SUBTITLE: 'Você vs o Cara Médio',

  LANDING: {
    TITLE: 'Você sabe conversar com mulheres…',
    TITLE_HIGHLIGHT: 'ou só reage mensagem por mensagem?',
    SUBTITLE: 'Teste sua habilidade em conversas reais com um Teclado de IA que entende o histórico e o perfil da mulher, não só a última frase.',
    EXPLAINER: 'Aqui não é joguinho isolado. Você entra em 3 conversas diferentes, responde do seu jeito ou usando o Teclado IA, e vê na prática como respostas mudam quando a IA conhece o contexto completo.',
    STEPS: [
      'Você enfrenta 3 conversas com níveis diferentes de dificuldade',
      'O Teclado IA analisa o histórico da conversa e o perfil da mulher',
      'Ele sugere respostas alinhadas ao jeito dela — e você escolhe se usa ou não',
    ],
    HIGHLIGHT_TITLE: 'O Teclado IA traça o perfil da mulher',
    HIGHLIGHT_TEXT: 'Ele entende padrões de conversa, interesses e comportamento ao longo do tempo — não só o que ela escreveu agora.',
    BUTTON_START: 'Começar o teste agora',
    MICROCOPY: 'leva menos de 3 minutos • você sente a diferença na hora',
  },

  ROUND_1: {
    TITLE: 'Round 1',
    SUBTITLE: 'Gire a roleta e descubra sua primeira conversa',
    SPINNING: 'Sorteando...',
    RESULT: 'Você vai conversar com',
    BUTTON_SPIN: 'Girar roleta',
    BUTTON_CONTINUE: 'Bora lá',
  },

  ROUND_2: {
    TITLE: 'Round 2',
    SUBTITLE: 'Escolha uma carta',
    DESCRIPTION: 'O desafio aumentou. Escolha com sabedoria.',
    BUTTON_CONTINUE: 'Conversar com',
  },

  ROUND_3: {
    TITLE: 'Round 3 - Final',
    SUBTITLE: 'Desafio Final',
    DESCRIPTION: 'Essa é a mais difícil. Você está pronto?',
    BUTTON_CONTINUE: 'Aceitar Desafio',
  },

  BUTTONS: {
    START_GAME: 'Começar',
    NEXT_ROUND: 'Próxima rodada',
    VIEW_RESULT: 'Ver resultado',
    VIEW_AI_SUGGESTIONS: 'Ver sugestões do Teclado IA',
    SEND_RESPONSE: 'Enviar resposta',
    UNLOCK_REWARD: 'Desbloquear recompensa',
    ACTIVATE_TRIAL: 'Ativar teste grátis',
    START_FREE_TRIAL: 'Começar teste gratuito',
  },

  RESULT: {
    WIN: 'Você bateu o Cara Médio.',
    LOSS: 'O Cara Médio te venceu.',
    WIN_SUBTITLE: 'A maioria dos homens perde. Você não.',
    LOSS_SUBTITLE: 'E ele não é esperto. Ele é só o padrão.',
    WIN_MESSAGE: 'Imagina ter essa vantagem em toda conversa real — no Tinder, no Instagram, no WhatsApp.',
    LOSS_MESSAGE: 'Se faltou repertório aqui, falta na vida real também. A boa notícia: isso se resolve.',
  },

  SCRATCH: {
    TITLE: 'Você desbloqueou um bônus. Raspe para revelar.',
    PRIZE: '7 dias grátis',
    PRIZE_DESCRIPTION: 'Cartao necessário, sem cobrança hoje',
  },

  CHECKOUT: {
    TITLE: '7 dias grátis',
    BENEFITS: [
      'Cancele quando quiser',
      'Sem cobrança hoje',
    ],
  },
} as const;
