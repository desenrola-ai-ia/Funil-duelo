// ============================================
// DESENROLA - Game Store (Zustand)
// ============================================

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  GameState,
  Round,
  ResponseTier,
  ResponseType,
  RoundResult
} from '@/types';
import {
  GAME_CONFIG,
  getRoundData,
  isWinningTier
} from '@/constants';

// ============================================
// INITIAL STATE
// ============================================

function createInitialRounds(): Round[] {
  return Array.from({ length: GAME_CONFIG.TOTAL_ROUNDS }, (_, index) => {
    const roundNumber = index + 1;
    const roundData = getRoundData(roundNumber);

    return {
      id: roundNumber,
      persona: roundData.persona,
      chat: roundData.chat,
      status: roundNumber === 1 ? 'playing' : 'pending',
      result: null,
      userResponse: null,
      responseType: null,
      responseTier: null,
      usedAI: false,
    };
  });
}

const initialState: GameState = {
  currentRound: 1,
  rounds: createInitialRounds(),
  playerScore: 0,
  opponentScore: 0,
  isGameOver: false,
  hasWon: null,
};

// ============================================
// STORE ACTIONS
// ============================================

interface GameActions {
  // Acoes do jogo
  submitResponse: (response: string, type: ResponseType, tier: ResponseTier) => void;
  nextRound: () => void;
  resetGame: () => void;

  // Helpers
  getCurrentRound: () => Round | undefined;
  checkPlotTwist: () => boolean;
  getAISuggestions: () => import('@/types').AISuggestion[];
}

// ============================================
// STORE
// ============================================

export const useGameStore = create<GameState & GameActions>()(
  devtools(
    (set, get) => ({
      ...initialState,

      /**
       * Submete a resposta do usuario
       */
      submitResponse: (response, type, tier) => {
        const state = get();
        const roundIndex = state.currentRound - 1;
        const round = state.rounds[roundIndex];

        if (!round || round.status !== 'playing') return;

        // Determina se ganhou baseado no tier
        const isWin = isWinningTier(tier);
        const result: RoundResult = isWin ? 'win' : 'loss';

        // Atualiza a rodada
        const updatedRounds = [...state.rounds];
        updatedRounds[roundIndex] = {
          ...round,
          status: 'completed',
          result,
          userResponse: response,
          responseType: type,
          responseTier: tier,
          usedAI: type === 'ai_suggestion',
        };

        // Atualiza placar
        const newPlayerScore = state.playerScore + (isWin ? 1 : 0);
        const newOpponentScore = state.opponentScore + (isWin ? 0 : 1);

        // Verifica se o jogo acabou
        const isGameOver =
          newPlayerScore >= GAME_CONFIG.ROUNDS_TO_WIN ||
          newOpponentScore >= GAME_CONFIG.ROUNDS_TO_WIN ||
          state.currentRound >= GAME_CONFIG.TOTAL_ROUNDS;

        const hasWon = isGameOver
          ? newPlayerScore > newOpponentScore
          : null;

        set({
          rounds: updatedRounds,
          playerScore: newPlayerScore,
          opponentScore: newOpponentScore,
          isGameOver,
          hasWon,
        });
      },

      /**
       * Avanca para a proxima rodada
       */
      nextRound: () => {
        const state = get();

        if (state.isGameOver) return;
        if (state.currentRound >= GAME_CONFIG.TOTAL_ROUNDS) return;

        const nextRoundNumber = state.currentRound + 1;
        const updatedRounds = [...state.rounds];

        // Marca a proxima rodada como 'playing'
        const nextRoundIndex = nextRoundNumber - 1;
        if (updatedRounds[nextRoundIndex]) {
          updatedRounds[nextRoundIndex] = {
            ...updatedRounds[nextRoundIndex],
            status: 'playing',
          };
        }

        set({
          currentRound: nextRoundNumber,
          rounds: updatedRounds,
        });
      },

      /**
       * Reseta o jogo para o estado inicial
       */
      resetGame: () => {
        set({
          ...initialState,
          rounds: createInitialRounds(),
        });
      },

      /**
       * Retorna a rodada atual
       */
      getCurrentRound: () => {
        const state = get();
        return state.rounds[state.currentRound - 1];
      },

      /**
       * Verifica se o plot twist deve ser aplicado
       * Plot twist: se usuario nao usou IA nas rodadas 1 e 2,
       * e usa na rodada 3, ganha Tier A garantido
       */
      checkPlotTwist: () => {
        const state = get();

        if (state.currentRound !== 3) return false;

        const round1 = state.rounds[0];
        const round2 = state.rounds[1];

        // Se nao usou IA nas rodadas 1 e 2
        return !round1?.usedAI && !round2?.usedAI;
      },

      /**
       * Retorna as sugestoes de IA da rodada atual
       */
      getAISuggestions: () => {
        const state = get();
        const roundData = getRoundData(state.currentRound);
        return roundData.aiSuggestions;
      },
    }),
    { name: 'desenrola-game' }
  )
);

// ============================================
// SELECTORS (para otimizar re-renders)
// ============================================

export const selectCurrentRound = (state: GameState) =>
  state.rounds[state.currentRound - 1];

export const selectScore = (state: GameState) => ({
  player: state.playerScore,
  opponent: state.opponentScore,
});

export const selectIsGameOver = (state: GameState) => state.isGameOver;

export const selectHasWon = (state: GameState) => state.hasWon;
