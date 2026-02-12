'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Trophy, Skull, Gift, Brain, Pen, Check, X } from 'lucide-react';
import { Button } from '@/components/ui';
import { useSoundKit } from '@/hooks/useSoundKit';
import { useHaptics } from '@/hooks/useHaptics';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useGameStore } from '@/stores';
import { ROUTES, UI_TEXTS, GAME_CONFIG, ROUND_CONFIGS } from '@/constants';
import { metaTrack } from '@/lib/metaTrack';
import type { ResponseTier } from '@/types';

// ============================================
// RESULT PAGE - /duelo/result
// Funcao: mostrar resultado + recap dos rounds + CTA recompensa
// ============================================

const TIER_LABELS: Record<ResponseTier, { label: string; color: string }> = {
  A: { label: 'Insano', color: 'text-green-400' },
  B: { label: 'Boa', color: 'text-emerald-400' },
  C: { label: 'Fraca', color: 'text-yellow-400' },
  D: { label: 'Ruim', color: 'text-red-400' },
};

export default function DueloResultPage() {
  const router = useRouter();
  const { playerScore, opponentScore, hasWon, isGameOver, rounds } = useGameStore();
  const { play } = useSoundKit();
  const { success, error } = useHaptics();
  const { track } = useAnalytics();

  // Redirect if game not finished
  useEffect(() => {
    if (!isGameOver) {
      router.push(ROUTES.LANDING);
    }
  }, [isGameOver, router]);

  // Efeitos de vitória/derrota
  useEffect(() => {
    if (!isGameOver) return;

    track('result_view');
    track('final_victory', { win: hasWon });
    metaTrack('CompleteRegistration', { content_name: 'Game Complete' });

    if (hasWon) {
      play('win');
      success();
    } else {
      play('loss');
      error();

      setTimeout(() => {
        play('sparkle', { volumeOverride: 0.4 });
      }, 500);
    }
  }, [isGameOver, hasWon, play, success, error]);

  const handleContinue = () => {
    router.push(ROUTES.DUELO_REWARD);
  };

  if (!isGameOver) {
    return null;
  }

  // Análise dos rounds pra copy inteligente
  const aiRounds = rounds.filter((r) => r.usedAI);
  const noAiRounds = rounds.filter((r) => !r.usedAI && r.status === 'completed');
  const aiWins = aiRounds.filter((r) => r.result === 'win').length;
  const noAiWins = noAiRounds.filter((r) => r.result === 'win').length;
  const usedAiAtLeastOnce = aiRounds.length > 0;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-zinc-950">
      <div className="w-full max-w-md mx-auto">

        {/* ── Ícone + Título ── */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className={`w-24 h-24 mx-auto mb-5 rounded-full flex items-center justify-center ${
            hasWon
              ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-2xl shadow-green-500/40'
              : 'bg-gradient-to-br from-red-500 to-rose-600 shadow-2xl shadow-red-500/40'
          }`}
        >
          {hasWon ? (
            <Trophy className="w-12 h-12 text-white" />
          ) : (
            <Skull className="w-12 h-12 text-white" />
          )}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`text-2xl font-black text-center mb-1 ${
            hasWon ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {hasWon ? UI_TEXTS.RESULT.WIN : UI_TEXTS.RESULT.LOSS}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-zinc-400 text-sm text-center mb-6"
        >
          {hasWon ? UI_TEXTS.RESULT.WIN_SUBTITLE : UI_TEXTS.RESULT.LOSS_SUBTITLE}
        </motion.p>

        {/* ── Placar Final (card estilizado) ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-5"
        >
          <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 text-center mb-4">
            Placar Final
          </p>

          <div className="flex justify-center items-center gap-6">
            <div className="text-center flex-1">
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.45, type: 'spring' }}
                className={`text-5xl font-black block ${hasWon ? 'text-green-400' : 'text-white'}`}
              >
                {playerScore}
              </motion.span>
              <p className="text-xs text-zinc-500 mt-1">Você</p>
            </div>

            <div className="text-zinc-700 text-2xl font-black">vs</div>

            <div className="text-center flex-1">
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.55, type: 'spring' }}
                className={`text-5xl font-black block ${!hasWon ? 'text-red-400' : 'text-white'}`}
              >
                {opponentScore}
              </motion.span>
              <p className="text-xs text-zinc-500 mt-1">{GAME_CONFIG.OPPONENT_NAME}</p>
            </div>
          </div>
        </motion.div>

        {/* ── Recap dos Rounds ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-5"
        >
          <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 mb-3">
            Seu Desempenho
          </p>

          <div className="space-y-2.5">
            {rounds.map((round, index) => {
              const config = ROUND_CONFIGS[index];
              const tier = round.responseTier;
              const tierInfo = tier ? TIER_LABELS[tier] : null;
              const won = round.result === 'win';

              return (
                <motion.div
                  key={round.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  {/* Resultado */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    won
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {won ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-white text-sm font-medium">
                        R{round.id}
                      </span>
                      <span className="text-zinc-600 text-sm">·</span>
                      <span className="text-zinc-400 text-sm truncate">
                        {round.persona.name || config.label}
                      </span>
                    </div>
                  </div>

                  {/* Tier */}
                  {tierInfo && (
                    <span className={`text-xs font-semibold ${tierInfo.color}`}>
                      {tierInfo.label}
                    </span>
                  )}

                  {/* Método */}
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    round.usedAI
                      ? 'bg-purple-500/15 text-purple-300'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}>
                    {round.usedAI ? (
                      <>
                        <Brain className="w-3 h-3" />
                        <span>IA</span>
                      </>
                    ) : (
                      <>
                        <Pen className="w-3 h-3" />
                        <span>Você</span>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ── Insight baseado no uso de IA ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="mb-5"
        >
          {usedAiAtLeastOnce && aiWins > noAiWins ? (
            // Usou IA e foi melhor com ela
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
              <p className="text-sm text-purple-200 text-center leading-relaxed">
                Nos rounds com o Teclado IA, você foi melhor.{' '}
                <span className="text-purple-400 font-semibold">
                  Não é coincidência.
                </span>
              </p>
            </div>
          ) : usedAiAtLeastOnce ? (
            // Usou IA mas resultado misto
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
              <p className="text-sm text-purple-200 text-center leading-relaxed">
                Você testou o Teclado IA. Agora imagina ele aprendendo{' '}
                <span className="text-purple-400 font-semibold">
                  o perfil de cada mina que você conversa.
                </span>
              </p>
            </div>
          ) : (
            // Nunca usou IA
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-sm text-zinc-300 text-center leading-relaxed">
                Você não usou o Teclado IA em nenhum round.{' '}
                <span className="text-zinc-400">
                  Como seria seu resultado se tivesse usado?
                </span>
              </p>
            </div>
          )}
        </motion.div>

        {/* ── Mensagem contextual ── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="text-zinc-500 text-xs text-center mb-5 leading-relaxed"
        >
          {hasWon ? UI_TEXTS.RESULT.WIN_MESSAGE : UI_TEXTS.RESULT.LOSS_MESSAGE}
        </motion.p>

        {/* ── Reward hint + CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="space-y-4"
        >
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
            <div className="flex items-center justify-center gap-2 text-yellow-400">
              <Gift className="w-4 h-4" />
              <span className="text-sm font-medium">Você desbloqueou algo. Toque pra descobrir.</span>
            </div>
          </div>

          <Button
            onClick={handleContinue}
            size="xl"
            fullWidth
            className="animate-pulse-glow font-bold"
          >
            {UI_TEXTS.BUTTONS.UNLOCK_REWARD}
          </Button>
        </motion.div>
      </div>
    </main>
  );
}
