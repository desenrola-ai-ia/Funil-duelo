'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Gift, Check, BookOpen, Brain, MessageCircle, Smartphone, BarChart3, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui';
import { useSoundKit } from '@/hooks/useSoundKit';
import { useHaptics } from '@/hooks/useHaptics';
import { useAnalytics } from '@/hooks/useAnalytics';
import { confettiBig, sparklesSmall } from '@/lib/particles';
import { ScratchCard } from '@/components/game';
import { ROUTES, UI_TEXTS, GAME_CONFIG } from '@/constants';
import { metaTrack, metaTrackCustom } from '@/lib/metaTrack';

// ============================================
// REWARD PAGE - /duelo/reward (Raspadinha)
// Funcao: recompensa gamificada
// Sempre revela: 7 dias grátis
// ============================================

const BENEFITS = [
  {
    icon: BookOpen,
    title: 'Lê a conversa inteira',
    description: 'Não analisa só a última mensagem. Entende todo o contexto do início ao fim.',
  },
  {
    icon: Brain,
    title: 'Monta o perfil dela',
    description: 'Aprende padrão de conversa, interesses e personalidade ao longo do tempo.',
  },
  {
    icon: MessageCircle,
    title: 'Respostas que fazem sentido',
    description: 'Nada de frase pronta genérica. Cada sugestão segue o fluxo da conversa.',
  },
  {
    icon: Smartphone,
    title: 'Funciona em qualquer app',
    description: 'WhatsApp, Tinder, Instagram, Bumble. Um teclado, todas as conversas.',
  },
  {
    icon: BarChart3,
    title: 'Avalia suas mensagens',
    description: 'Tier A, B, C ou D em tempo real. Você vê onde tá acertando e onde pode melhorar.',
  },
  {
    icon: TrendingUp,
    title: 'Fica mais inteligente com o tempo',
    description: 'Quanto mais você conversa, melhor ele entende cada pessoa.',
  },
];

export default function DueloRewardPage() {
  const router = useRouter();
  const [isRevealed, setIsRevealed] = useState(false);
  const startTimeRef = useRef<number>(0);
  const { play } = useSoundKit();
  const { heavy } = useHaptics();
  const { track } = useAnalytics();

  useEffect(() => {
    startTimeRef.current = Date.now();
    track('reward_view');
    metaTrack('ViewContent', { content_name: 'Reward - 7 days free' });
  }, [track]);

  const handleReveal = () => {
    setIsRevealed(true);

    // Track reveal
    const timeToRevealMs = Date.now() - startTimeRef.current;
    track('reward_reveal', { timeToRevealMs });
    metaTrackCustom('RewardRevealed', { timeToRevealMs });

    // Efeitos do reveal completo
    play('reward');
    confettiBig();
    heavy();

    // Segundo burst de confetti
    setTimeout(() => {
      sparklesSmall();
    }, 600);
  };

  const handleActivate = () => {
    metaTrackCustom('StartCheckout', { source: 'reward' });
    router.push(ROUTES.CHECKOUT);
  };

  return (
    <main className={`min-h-screen flex flex-col items-center p-4 bg-zinc-950 ${isRevealed ? 'justify-start pt-6 pb-16' : 'justify-center'}`}>
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-2xl shadow-yellow-500/40"
          >
            <Gift className="w-10 h-10 text-white" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-white mb-2"
          >
            Raspe para revelar
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-zinc-400 text-sm"
          >
            Você desbloqueou um bônus especial
          </motion.p>
        </motion.div>

        {/* Scratch card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <ScratchCard
            prize={`${GAME_CONFIG.FREE_TRIAL_DAYS} dias grátis`}
            description="Acesso completo ao Desenrola AI"
            onReveal={handleReveal}
          />
        </motion.div>

        {/* CTA + Benefits after reveal */}
        <AnimatePresence>
          {isRevealed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="space-y-6"
            >
              {/* Success checkmark */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="flex items-center justify-center gap-2 text-green-400"
              >
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
                <span className="font-medium">{GAME_CONFIG.FREE_TRIAL_DAYS} dias grátis desbloqueados!</span>
              </motion.div>

              {/* Transition headline */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center"
              >
                <p className="text-sm text-zinc-300 leading-relaxed">
                  Isso que você viu no jogo?{' '}
                  <span className="text-purple-400 font-semibold">Na vida real é ainda melhor.</span>
                </p>
              </motion.div>

              {/* Benefits list */}
              <div className="space-y-2.5">
                {BENEFITS.map((benefit, index) => (
                  <motion.div
                    key={benefit.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="flex items-start gap-3 bg-zinc-900/60 border border-zinc-800/50 rounded-xl p-3"
                  >
                    <div className="w-9 h-9 rounded-lg bg-purple-500/15 flex items-center justify-center shrink-0 mt-0.5">
                      <benefit.icon className="w-[18px] h-[18px] text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium leading-snug">{benefit.title}</p>
                      <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{benefit.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Activate button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6 }}
                onAnimationComplete={() => track('reward_benefits_visible')}
              >
                <Button
                  onClick={handleActivate}
                  size="xl"
                  fullWidth
                  className="animate-pulse-glow font-bold"
                >
                  {UI_TEXTS.BUTTONS.ACTIVATE_TRIAL}
                </Button>
              </motion.div>

              {/* Info text */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8 }}
                className="text-center space-y-1"
              >
                <p className="text-zinc-400 text-sm">
                  Cartão necessário para ativar
                </p>
                <p className="text-zinc-500 text-xs">
                  Sem cobrança hoje - cancele quando quiser
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hint before reveal */}
        {!isRevealed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-2 text-zinc-500 text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Use o dedo para raspar</span>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}
