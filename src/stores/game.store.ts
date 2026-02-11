// ============================================
// DESENROLA - Game Store (Zustand)
// ============================================

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
  GameState,
  Round,
  ResponseTier,
  ResponseType,
  RoundResult,
  PersonaData,
  AISuggestion,
} from '@/types';
import { GAME_CONFIG, isWinningTier } from '@/constants';

// ============================================
// INITIAL STATE
// ============================================

function createEmptyRounds(): Round[] {
  return Array.from({ length: GAME_CONFIG.TOTAL_ROUNDS }, (_, index) => {
    const roundNumber = index + 1;
    return {
      id: roundNumber,
      persona: {
        id: '',
        name: '',
        age: 0,
        bio: '',
        context: '',
        difficulty: 'EASY',
      },
      chat: [],
      status: 'pending',
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
  rounds: createEmptyRounds(),
  playerScore: 0,
  opponentScore: 0,
  isGameOver: false,
  hasWon: null,
  roundResults: {},
  selectedPersonas: {},
};

// ============================================
// LOGICA DE VITORIA INVISIVEL
// ============================================

/**
 * Calcula vitoria baseado nas regras invisiveis:
 * - Vence se: acertar round 3 OU acertar 2 rounds OU acertar round 2
 * - Perde SOMENTE se: errar TODOS os rounds
 */
function calculateInvisibleWin(roundResults: Record<number, boolean>): boolean {
  const r1 = roundResults[1] ?? false;
  const r2 = roundResults[2] ?? false;
  const r3 = roundResults[3] ?? false;

  // Vence se acertar round 3
  if (r3) return true;

  // Vence se acertar round 2
  if (r2) return true;

  // Vence se acertar 2 ou mais rounds
  const totalWins = [r1, r2, r3].filter(Boolean).length;
  if (totalWins >= 2) return true;

  // Vence se acertou pelo menos 1 round (so perde se errar todos)
  return totalWins > 0;
}

// ============================================
// STORE ACTIONS
// ============================================

interface GameActions {
  // Acoes do jogo
  selectPersonaForRound: (roundNumber: number, personaData: PersonaData) => void;
  setRoundPlaying: (roundNumber: number) => void;
  submitResponse: (response: string, type: ResponseType, tier: ResponseTier) => void;
  nextRound: () => void;
  finalizeGame: () => void;
  resetGame: () => void;

  // Helpers
  getCurrentRound: () => Round | undefined;
  getCurrentPersonaData: () => PersonaData | undefined;
  checkPlotTwist: () => boolean;
  getAISuggestions: () => AISuggestion[];
}

// ============================================
// STORE
// ============================================

export const useGameStore = create<GameState & GameActions>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        /**
         * Seleciona a persona para um round especifico
         */
        selectPersonaForRound: (roundNumber, personaData) => {
          const state = get();
          const roundIndex = roundNumber - 1;

          // Atualiza a persona selecionada
          const updatedSelectedPersonas = {
            ...state.selectedPersonas,
            [roundNumber]: personaData,
          };

          // Atualiza o round com os dados da persona
          const updatedRounds = [...state.rounds];
          if (updatedRounds[roundIndex]) {
            updatedRounds[roundIndex] = {
              ...updatedRounds[roundIndex],
              persona: personaData.persona,
              chat: personaData.chat,
            };
          }

          set({
            selectedPersonas: updatedSelectedPersonas,
            rounds: updatedRounds,
          });
        },

        /**
         * Marca um round como 'playing'
         */
        setRoundPlaying: (roundNumber) => {
          const state = get();
          const roundIndex = roundNumber - 1;

          const updatedRounds = [...state.rounds];
          if (updatedRounds[roundIndex]) {
            updatedRounds[roundIndex] = {
              ...updatedRounds[roundIndex],
              status: 'playing',
            };
          }

          set({
            currentRound: roundNumber,
            rounds: updatedRounds,
          });
        },

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

          // Atualiza roundResults para calculo de vitoria invisivel
          const updatedRoundResults = {
            ...state.roundResults,
            [state.currentRound]: isWin,
          };

          // Atualiza placar (visivel para o usuario)
          const newPlayerScore = state.playerScore + (isWin ? 1 : 0);
          const newOpponentScore = state.opponentScore + (isWin ? 0 : 1);

          set({
            rounds: updatedRounds,
            roundResults: updatedRoundResults,
            playerScore: newPlayerScore,
            opponentScore: newOpponentScore,
          });
        },

        /**
         * Avanca para a proxima rodada
         */
        nextRound: () => {
          const state = get();

          if (state.isGameOver) return;
          if (state.currentRound >= GAME_CONFIG.TOTAL_ROUNDS) return;

          set({
            currentRound: state.currentRound + 1,
          });
        },

        /**
         * Finaliza o jogo usando a logica de vitoria invisivel
         */
        finalizeGame: () => {
          const state = get();

          // Calcula vitoria usando logica invisivel
          const hasWon = calculateInvisibleWin(state.roundResults);

          set({
            isGameOver: true,
            hasWon,
          });
        },

        /**
         * Reseta o jogo para o estado inicial
         */
        resetGame: () => {
          set({
            ...initialState,
            rounds: createEmptyRounds(),
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
         * Retorna os dados completos da persona atual
         */
        getCurrentPersonaData: () => {
          const state = get();
          return state.selectedPersonas[state.currentRound];
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
          const personaData = state.selectedPersonas[state.currentRound];
          return personaData?.aiSuggestions ?? [];
        },
      }),
      {
        name: 'desenrola-game-storage',
      }
    ),
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

export const selectRoundResults = (state: GameState) => state.roundResults;
