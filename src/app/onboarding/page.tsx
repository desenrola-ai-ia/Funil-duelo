'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Download, Smartphone, ArrowRight, Copy, Check, Mail } from 'lucide-react';
import { Button } from '@/components/ui';
import { useSoundKit } from '@/hooks/useSoundKit';
import { useHaptics } from '@/hooks/useHaptics';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { GAME_CONFIG } from '@/constants';
import { metaTrack, metaTrackCustom } from '@/lib/metaTrack';

// ============================================
// ONBOARDING PAGE (Post-Checkout Success)
// ============================================

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingContent />
    </Suspense>
  );
}

function OnboardingContent() {
  const { play } = useSoundKit();
  const { success, tap } = useHaptics();
  const { track } = useAnalytics();
  const [copied, setCopied] = useState(false);
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);
  const searchParams = useSearchParams();

  // Fetch session info + Meta Pixel Purchase
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) return;

    fetch(`/api/checkout/session?session_id=${sessionId}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data) return;
        if (data.email) setCustomerEmail(data.email);

        // Meta Pixel: Purchase — anti-refire por session_id
        const isPaid = data.status === 'paid' || data.subscriptionStatus === 'trialing' || data.subscriptionStatus === 'active';
        const key = `purchase_sent_${sessionId}`;
        if (isPaid && !localStorage.getItem(key)) {
          const value = data.amountTotal ? data.amountTotal / 100 : 0;
          metaTrack('Purchase', {
            value,
            currency: (data.currency || 'brl').toUpperCase(),
            content_name: data.plan || 'unknown',
            trial: true,
          });
          localStorage.setItem(key, '1');
        }
      })
      .catch(() => {});
  }, [searchParams]);

  // Efeitos no mount
  useEffect(() => {
    track('onboarding_complete');
    play('win', { volumeOverride: 0.45 });
    success();
  }, [play, success, track]);

  // Handler de copy
  const handleCopy = async () => {
    const message = "Opa! Testando o Desenrola AI aqui. Que top! 🔥";
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      play('ui-click');
      tap();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback silencioso
    }
  };

  const steps = [
    {
      icon: Download,
      title: 'Baixe o app',
      description: 'Disponivel na App Store é Google Play',
    },
    {
      icon: Smartphone,
      title: 'Instale o Teclado IA',
      description: 'Siga as instrucoes no app para ativar',
    },
    {
      icon: ArrowRight,
      title: 'Comece a usar',
      description: 'O Desenrola AI ja está pronto para te ajudar',
    },
  ];

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto text-center">
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30"
        >
          <CheckCircle className="w-10 h-10 text-white" />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold text-white mb-2"
        >
          Parabens!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-zinc-400 mb-8"
        >
          Seus {GAME_CONFIG.FREE_TRIAL_DAYS} dias grátis foram ativados
        </motion.p>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full mb-4"
        >
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span className="text-sm font-medium text-green-300">
            Modo Teclado Desbloqueado
          </span>
        </motion.div>

        {/* Account info */}
        {customerEmail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="flex items-center justify-center gap-2 mb-6 text-sm text-zinc-500"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Sua conta: <span className="text-zinc-300">{customerEmail}</span></span>
          </motion.div>
        )}

        {/* Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-zinc-900 rounded-2xl p-6 mb-8 text-left"
        >
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-4">
            Próximos passos
          </h2>

          <div className="space-y-4">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <step.icon className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{step.title}</h3>
                  <p className="text-sm text-zinc-500">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Download buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-3"
        >
          <Button
            size="xl"
            fullWidth
            onClick={() => {
              metaTrackCustom('AppDownloadClick', { store: 'ios' });
              // TODO: Add App Store link
              window.open('#', '_blank');
            }}
          >
            <Download className="w-5 h-5 mr-2" />
            Baixar na App Store
          </Button>

          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={() => {
              metaTrackCustom('AppDownloadClick', { store: 'android' });
              // TODO: Add Play Store link
              window.open('#', '_blank');
            }}
          >
            <Download className="w-5 h-5 mr-2" />
            Baixar no Google Play
          </Button>
        </motion.div>

        {/* Botão de copiar mensagem */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-8"
        >
          <Button
            onClick={handleCopy}
            variant="ghost"
            size="lg"
            fullWidth
            className="font-medium"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Mensagem Copiada!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copiar mensagem pronta
              </>
            )}
          </Button>
          <p className="text-xs text-center text-zinc-500 mt-2">
            Use para testar o teclado nas suas conversas
          </p>
        </motion.div>

        {/* Support */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="text-zinc-600 text-sm mt-8"
        >
          Precisa de ajuda? Entre em contato pelo suporte no app.
        </motion.p>
      </div>
    </main>
  );
}
