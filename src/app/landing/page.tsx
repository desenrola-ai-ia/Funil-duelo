'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Brain, Zap, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui';
import { ROUTES } from '@/constants';
import { useGameStore } from '@/stores';
import { useSoundKit } from '@/hooks/useSoundKit';
import { useHaptics } from '@/hooks/useHaptics';
import { useAnalytics } from '@/hooks/useAnalytics';

// ============================================
// LANDING PAGE - Funil direto (v3)
// ============================================

export default function LandingPage() {
  const router = useRouter();
  const resetGame = useGameStore((state) => state.resetGame);
  const { play } = useSoundKit();
  const { tap } = useHaptics();
  const { track } = useAnalytics();

  const handlePointerDown = () => {
    play('ui-click', { cooldownMs: 80 });
    tap();
  };

  const handleStart = () => {
    play('whoosh');
    track('game_start');
    resetGame();
    router.push(ROUTES.ROUND_1);
  };

  return (
    <main className="min-h-screen flex flex-col items-center p-4 pt-10 pb-16 bg-zinc-950">
      <div className="w-full max-w-md mx-auto">

        {/* ── Badge topo ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center mb-6"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-xs font-semibold text-purple-300">
            <Zap className="w-3 h-3" />
            Teste gratuito de 3 min
          </span>
        </motion.div>

        {/* ── Hero ── */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-center mb-8"
        >
          <h1 className="text-[1.7rem] font-black text-white leading-tight tracking-tight">
            Você sabe conversar
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              ou só reage mensagem por mensagem?
            </span>
          </h1>
          <p className="text-sm text-zinc-500 mt-3">
            Descubra em 3 conversas reais com IA
          </p>
        </motion.div>

        {/* ── Chat Mockup: Sem IA vs Com IA ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mb-8 space-y-3"
        >
          {/* Mensagem da mina */}
          <div className="flex justify-start">
            <div className="bg-zinc-800 rounded-2xl rounded-bl-md px-4 py-2.5 max-w-[80%]">
              <p className="text-sm text-zinc-200">esse match foi culpa do álcool ou vc é interessante mesmo? kkk</p>
              <span className="text-[10px] text-zinc-600 mt-1 block">22:42</span>
            </div>
          </div>

          {/* Resposta SEM IA */}
          <div className="flex justify-end">
            <div className="relative bg-zinc-800/60 border border-zinc-700/50 rounded-2xl rounded-br-md px-4 py-2.5 max-w-[80%]">
              <span className="absolute -top-2.5 right-3 text-[9px] font-bold uppercase tracking-wider text-red-400 bg-zinc-950 px-1.5">sem IA</span>
              <p className="text-sm text-zinc-400 italic">haha boa kkk sou sim</p>
            </div>
          </div>

          {/* Resposta COM IA */}
          <div className="flex justify-end">
            <div className="relative bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/40 rounded-2xl rounded-br-md px-4 py-2.5 max-w-[80%]">
              <span className="absolute -top-2.5 right-3 text-[9px] font-bold uppercase tracking-wider text-purple-300 bg-zinc-950 px-1.5 flex items-center gap-1">
                <Zap className="w-2.5 h-2.5" />com IA
              </span>
              <p className="text-sm text-white">Culpa do álcool? Você deu match sóbria. Agora só tá com coragem pra falar comigo</p>
            </div>
          </div>
        </motion.div>

        {/* ── Separador visual ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-3 mb-8"
        >
          <div className="flex-1 h-px bg-zinc-800" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">como funciona</span>
          <div className="flex-1 h-px bg-zinc-800" />
        </motion.div>

        {/* ── 3 Passos visuais ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="space-y-3 mb-8"
        >
          {[
            { num: '1', text: 'Você entra em 3 conversas diferentes', sub: 'Fácil, média e difícil' },
            { num: '2', text: 'Responde do seu jeito ou usa o Teclado IA', sub: 'Ele analisa o perfil e o histórico dela' },
            { num: '3', text: 'Vê na prática a diferença', sub: 'Contexto muda tudo na resposta' },
          ].map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="flex items-center gap-4 bg-zinc-900/60 rounded-xl p-3 border border-zinc-800/50"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-black text-sm">{step.num}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium leading-snug">{step.text}</p>
                <p className="text-xs text-zinc-500">{step.sub}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Destaque brain ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.95 }}
          className="bg-purple-500/10 border border-purple-500/25 rounded-2xl p-4 mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
              <Brain className="w-4.5 h-4.5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-white font-semibold">Ele traça o perfil dela</p>
              <p className="text-xs text-zinc-400">Padrões, interesses, comportamento — não só a última frase</p>
            </div>
          </div>
        </motion.div>

        {/* ── Social proof ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.05 }}
          className="grid grid-cols-3 gap-2 mb-8"
        >
          {[
            { value: '3', label: 'conversas' },
            { value: '~3min', label: 'pra testar' },
            { value: '100%', label: 'gratuito' },
          ].map((stat, i) => (
            <div key={i} className="text-center py-2.5 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
              <span className="block text-lg font-black text-white">{stat.value}</span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{stat.label}</span>
            </div>
          ))}
        </motion.div>

        {/* ── CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.15 }}
        >
          <Button
            onClick={handleStart}
            onPointerDown={handlePointerDown}
            size="xl"
            fullWidth
            className="animate-pulse-glow font-bold text-lg"
          >
            <span className="flex items-center justify-center gap-2">
              Testar minha lábia agora
              <ChevronRight className="w-5 h-5" />
            </span>
          </Button>

          <p className="text-[11px] text-center text-zinc-600 mt-3">
            sem cadastro &bull; sem cartão &bull; resultado na hora
          </p>
        </motion.div>
      </div>
    </main>
  );
}
