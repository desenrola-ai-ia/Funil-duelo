'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import {
  Scoreboard,
  AdvantageBar,
  PersonaCard,
  ChatContainer,
  ResponseInput,
  FeedbackDisplay,
} from '@/components/game';
import { useGameStore } from '@/stores';
import {
  ROUTES,
  UI_TEXTS,
  GAME_CONFIG,
  getRoundData,
  getRandomFeedback,
  isWinningTier,
} from '@/constants';
import type { ResponseType, AISuggestion, TierFeedback, ResponseTier } from '@/types';

// ============================================
// DUEL PAGE (Game Screen)
// ============================================

type GamePhase = 'playing' | 'feedback' | 'transition';

export default function DuelPage() {
  const router = useRouter();

  // Game state
  const {
    currentRound,
    playerScore,
    opponentScore,
    isGameOver,
    rounds,
    submitResponse,
    nextRound,
    checkPlotTwist,
    getAISuggestions,
  } = useGameStore();

  // Local state
  const [phase, setPhase] = useState<GamePhase>('playing');
  const [feedback, setFeedback] = useState<TierFeedback | null>(null);
  const [isWin, setIsWin] = useState(false);

  // Get current round data
  const roundData = getRoundData(currentRound);
  const currentRoundState = rounds[currentRound - 1];
  const aiSuggestions = getAISuggestions();

  // Redirect if game is over
  useEffect(() => {
    if (isGameOver) {
      router.push(ROUTES.RESULT);
    }
  }, [isGameOver, router]);

  // Handle response submission
  const handleSubmit = (
    response: string,
    type: ResponseType,
    suggestion?: AISuggestion
  ) => {
    let tier: ResponseTier;

    if (type === 'ai_suggestion' && suggestion) {
      // Check for plot twist (AI used only in round 3)
      const isPlotTwist = checkPlotTwist();
      tier = isPlotTwist ? 'A' : suggestion.tier;
    } else {
      // Typed response - randomly assign C or D tier
      tier = Math.random() > 0.3 ? 'C' : 'D';
    }

    // Submit to store
    submitResponse(response, type, tier);

    // Show feedback
    const tierFeedback = getRandomFeedback(tier);
    setFeedback(tierFeedback);
    setIsWin(isWinningTier(tier));
    setPhase('feedback');
  };

  // Handle next round
  const handleNextRound = () => {
    // Check if player already won/lost (2 wins needed)
    const newPlayerScore = playerScore + (isWin ? 1 : 0);
    const newOpponentScore = opponentScore + (isWin ? 0 : 1);

    if (
      newPlayerScore >= GAME_CONFIG.ROUNDS_TO_WIN ||
      newOpponentScore >= GAME_CONFIG.ROUNDS_TO_WIN
    ) {
      router.push(ROUTES.RESULT);
      return;
    }

    // Go to next round if available
    if (currentRound < GAME_CONFIG.TOTAL_ROUNDS) {
      setPhase('transition');
      setTimeout(() => {
        nextRound();
        setFeedback(null);
        setPhase('playing');
      }, 300);
    } else {
      router.push(ROUTES.RESULT);
    }
  };

  // Determine button text
  const getButtonText = () => {
    const newPlayerScore = playerScore + (isWin ? 1 : 0);
    const newOpponentScore = opponentScore + (isWin ? 0 : 1);

    if (
      newPlayerScore >= GAME_CONFIG.ROUNDS_TO_WIN ||
      newOpponentScore >= GAME_CONFIG.ROUNDS_TO_WIN ||
      currentRound >= GAME_CONFIG.TOTAL_ROUNDS
    ) {
      return UI_TEXTS.BUTTONS.VIEW_RESULT;
    }
    return UI_TEXTS.BUTTONS.NEXT_ROUND;
  };

  return (
    <main className="min-h-screen flex flex-col p-4">
      <div className="w-full max-w-md mx-auto flex flex-col flex-1">
        {/* Header: Scoreboard */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <Scoreboard
            playerScore={playerScore}
            opponentScore={opponentScore}
            currentRound={currentRound}
          />
        </motion.div>

        {/* Advantage bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <AdvantageBar
            playerScore={playerScore}
            opponentScore={opponentScore}
          />
        </motion.div>

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            {phase === 'playing' && (
              <motion.div
                key="playing"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col flex-1"
              >
                {/* Persona card */}
                <PersonaCard
                  persona={roundData.persona}
                  context={roundData.persona.context}
                  className="mb-4"
                />

                {/* Chat */}
                <ChatContainer
                  messages={roundData.chat}
                  className="mb-4 flex-1"
                />

                {/* Response input */}
                <ResponseInput
                  aiSuggestions={aiSuggestions}
                  onSubmit={handleSubmit}
                  disabled={currentRoundState?.status === 'completed'}
                />
              </motion.div>
            )}

            {phase === 'feedback' && feedback && (
              <motion.div
                key="feedback"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col flex-1 justify-center"
              >
                {/* Feedback display */}
                <FeedbackDisplay
                  feedback={feedback}
                  isWin={isWin}
                  className="mb-6"
                />

                {/* Next button */}
                <Button
                  onClick={handleNextRound}
                  size="xl"
                  fullWidth
                >
                  {getButtonText()}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
