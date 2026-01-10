export * from './feedbacks';
export * from './personas';

// ============================================
// CONFIGURACOES GERAIS DO JOGO
// ============================================

export const GAME_CONFIG = {
  /** Numero total de rodadas */
  TOTAL_ROUNDS: 3,

  /** Rodadas necessarias para vencer (melhor de 3) */
  ROUNDS_TO_WIN: 2,

  /** Dias de trial gratis */
  FREE_TRIAL_DAYS: 7,

  /** Nome do oponente */
  OPPONENT_NAME: 'Cara Medio',
} as const;

// ============================================
// ROTAS DO FUNIL
// ============================================

export const ROUTES = {
  HOME: '/',
  DUEL: '/duel',
  RESULT: '/result',
  SCRATCH: '/scratch',
  CHECKOUT: '/checkout',
  ONBOARDING: '/onboarding',
} as const;

// ============================================
// TEXTOS DA UI
// ============================================

export const UI_TEXTS = {
  GAME_TITLE: 'Duelo de Labia',
  GAME_SUBTITLE: 'Voce vs o Cara Medio',

  RULES: [
    'Melhor de 3',
    'Voce pode digitar sua resposta',
    'Ou usar o Teclado IA (melhor movimento)',
  ],

  BUTTONS: {
    START_GAME: 'Comecar rodada 1',
    NEXT_ROUND: 'Proxima rodada',
    VIEW_RESULT: 'Ver resultado',
    VIEW_AI_SUGGESTIONS: 'Ver sugestoes do Teclado IA',
    SEND_RESPONSE: 'Enviar resposta',
    UNLOCK_REWARD: 'Desbloquear recompensa',
    ACTIVATE_TRIAL: 'Ativar teste gratis',
    START_FREE_TRIAL: 'Comecar teste gratuito',
  },

  RESULT: {
    WIN: 'Voce venceu do Cara Medio',
    LOSS: 'Voce perdeu do Cara Medio',
    WIN_MESSAGE: 'Voce tomou melhores decisoes.',
    LOSS_MESSAGE: 'Um movimento errado muda tudo.',
  },

  SCRATCH: {
    TITLE: 'Voce desbloqueou um bonus. Raspe para revelar.',
    PRIZE: '7 dias gratis',
    PRIZE_DESCRIPTION: 'Cartao necessario, sem cobranca hoje',
  },

  CHECKOUT: {
    TITLE: '7 dias gratis',
    BENEFITS: [
      'Cancele quando quiser',
      'Sem cobranca hoje',
    ],
  },
} as const;
