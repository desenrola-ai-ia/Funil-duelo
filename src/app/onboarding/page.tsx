'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Download, Smartphone, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui';
import { GAME_CONFIG } from '@/constants';

// ============================================
// ONBOARDING PAGE (Post-Checkout Success)
// ============================================

export default function OnboardingPage() {
  const steps = [
    {
      icon: Download,
      title: 'Baixe o app',
      description: 'Disponivel na App Store e Google Play',
    },
    {
      icon: Smartphone,
      title: 'Instale o Teclado IA',
      description: 'Siga as instrucoes no app para ativar',
    },
    {
      icon: ArrowRight,
      title: 'Comece a usar',
      description: 'O Desenrola AI ja esta pronto pra te ajudar',
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
          Seus {GAME_CONFIG.FREE_TRIAL_DAYS} dias gratis foram ativados
        </motion.p>

        {/* Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-zinc-900 rounded-2xl p-6 mb-8 text-left"
        >
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-4">
            Proximos passos
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
              // TODO: Add Play Store link
              window.open('#', '_blank');
            }}
          >
            <Download className="w-5 h-5 mr-2" />
            Baixar no Google Play
          </Button>
        </motion.div>

        {/* Support */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-zinc-600 text-sm mt-8"
        >
          Precisa de ajuda? Entre em contato pelo suporte no app.
        </motion.p>
      </div>
    </main>
  );
}
