'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Clock, Check, Zap, Crown, Mail, User } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { useSoundKit } from '@/hooks/useSoundKit';
import { useHaptics } from '@/hooks/useHaptics';
import { useAnalytics } from '@/hooks/useAnalytics';
import { GAME_CONFIG } from '@/constants';

// ============================================
// STRIPE SETUP
// ============================================

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

// ============================================
// PLAN CONFIG
// ============================================

interface Plan {
  id: string;
  name: string;
  period: string;
  priceDisplay: string;
  perMonth: string;
  badge?: string;
  priceId: string;
}

const PLANS: Plan[] = [
  {
    id: 'monthly',
    name: 'Mensal',
    period: '/mes',
    priceDisplay: '',
    perMonth: '',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY || '',
  },
  {
    id: 'quarterly',
    name: 'Trimestral',
    period: '/3 meses',
    priceDisplay: '',
    perMonth: '',
    badge: 'Popular',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_QUARTERLY || '',
  },
  {
    id: 'yearly',
    name: 'Anual',
    period: '/ano',
    priceDisplay: '',
    perMonth: '',
    badge: 'Melhor valor',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY || '',
  },
];

// ============================================
// STRIPE CHECKOUT WRAPPER
// ============================================

function StripeCheckoutEmbed({ clientSecret }: { clientSecret: string }) {
  if (!stripePromise) return <p className="text-red-400 text-sm text-center">Stripe nao configurado</p>;

  return (
    <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
      <EmbeddedCheckout className="rounded-xl overflow-hidden" />
    </EmbeddedCheckoutProvider>
  );
}

// ============================================
// CHECKOUT STEPS
// ============================================

type CheckoutStep = 'info' | 'plan' | 'payment';

// ============================================
// CHECKOUT PAGE
// ============================================

export default function CheckoutPage() {
  const [step, setStep] = useState<CheckoutStep>('info');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string>('quarterly');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const emailRef = useRef<HTMLInputElement>(null);
  const { play } = useSoundKit();
  const { tap } = useHaptics();
  const { track } = useAnalytics();

  useEffect(() => {
    track('checkout_view');
  }, [track]);

  // Validar email
  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  // Step 1: Continuar com email/nome
  const handleContinueWithInfo = () => {
    if (!email.trim()) {
      setError('Digite seu email');
      emailRef.current?.focus();
      return;
    }
    if (!isValidEmail(email)) {
      setError('Email invalido');
      emailRef.current?.focus();
      return;
    }

    setError('');
    setStep('plan');
    play('ui-click', { volumeOverride: 0.15 });
    tap();
    track('checkout_email_entered');
  };

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    setClientSecret(null);
    setError('');
    play('ui-click', { volumeOverride: 0.15, cooldownMs: 120 });
    tap();
  };

  const handleStartCheckout = async () => {
    const plan = PLANS.find((p) => p.id === selectedPlan);
    if (!plan || !plan.priceId) {
      setError('Plano nao disponivel. Configure as variaveis de ambiente do Stripe.');
      return;
    }

    setIsLoading(true);
    setError('');
    play('whoosh', { volumeOverride: 0.25 });
    tap();

    try {
      const res = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: plan.priceId,
          plan: plan.id,
          email: email.toLowerCase().trim(),
          name: name.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao iniciar checkout');
        if (data.existingSubscription) {
          setError('Este email ja possui uma assinatura. Faca login no app para acessar.');
        }
        return;
      }

      setClientSecret(data.clientSecret);
      setStep('payment');
      track('checkout_started', { plan: plan.id });
    } catch {
      setError('Erro de conexao. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const benefits = [
    { icon: Clock, text: GAME_CONFIG.FREE_TRIAL_DAYS + ' dias gratis' },
    { icon: Shield, text: 'Cancele quando quiser' },
    { icon: Check, text: 'Sem cobranca hoje' },
  ];

  const activePlans = PLANS.filter((p) => p.priceId);
  const stripeConfigured = stripePromise && activePlans.length > 0;

  return (
    <main className="min-h-screen flex flex-col p-4 py-8">
      <div className="w-full max-w-lg mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h1 className="text-3xl font-bold text-white mb-2">
            {GAME_CONFIG.FREE_TRIAL_DAYS} dias gratis
          </h1>
          <p className="text-zinc-400">
            Acesso completo ao Desenrola AI
          </p>
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-2 mb-6"
        >
          {benefits.map((benefit, index) => (
            <div key={index} className="bg-zinc-900 rounded-xl p-3 text-center">
              <benefit.icon className="w-5 h-5 mx-auto mb-2 text-purple-400" />
              <span className="text-xs text-zinc-400">{benefit.text}</span>
            </div>
          ))}
        </motion.div>

        {stripeConfigured ? (
          <>
            <AnimatePresence mode="wait">
              {/* Step 1: Email + Nome */}
              {step === 'info' && (
                <motion.div
                  key="info-step"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-4 mb-6"
                >
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1.5">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        ref={emailRef}
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(''); }}
                        onKeyDown={(e) => e.key === 'Enter' && handleContinueWithInfo()}
                        placeholder="seu@email.com"
                        className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition-colors"
                        autoComplete="email"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-1.5">Nome <span className="text-zinc-600">(opcional)</span></label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleContinueWithInfo()}
                        placeholder="Seu nome"
                        className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition-colors"
                        autoComplete="given-name"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleContinueWithInfo}
                    className="w-full py-4 rounded-xl font-semibold text-white text-lg bg-purple-600 hover:bg-purple-700 active:scale-[0.98] transition-all"
                  >
                    Continuar
                  </button>
                </motion.div>
              )}

              {/* Step 2: Plan selector */}
              {step === 'plan' && (
                <motion.div
                  key="plan-step"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: 0.1 }}
                >
                  {/* Email display */}
                  <button
                    onClick={() => { setStep('info'); setClientSecret(null); }}
                    className="flex items-center gap-2 mb-4 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    {email}
                    <span className="text-purple-400 text-xs">(alterar)</span>
                  </button>

                  <div className="space-y-3 mb-6">
                    {activePlans.map((plan) => (
                      <button
                        key={plan.id}
                        onClick={() => handleSelectPlan(plan.id)}
                        className={
                          'w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ' +
                          (selectedPlan === plan.id
                            ? 'border-purple-500 bg-purple-500/10'
                            : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700')
                        }
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={
                              'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ' +
                              (selectedPlan === plan.id ? 'border-purple-500 bg-purple-500' : 'border-zinc-600')
                            }
                          >
                            {selectedPlan === plan.id && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div className="text-left">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">{plan.name}</span>
                              {plan.badge && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                                  {plan.badge}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {plan.id === 'quarterly' && (
                          <Crown className="w-4 h-4 text-purple-400" />
                        )}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleStartCheckout}
                    disabled={isLoading}
                    className={
                      'w-full py-4 rounded-xl font-semibold text-white text-lg transition-all ' +
                      (isLoading
                        ? 'bg-purple-700 opacity-60 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-700 active:scale-[0.98]')
                    }
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Preparando...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Zap className="w-5 h-5" />
                        Comecar teste gratuito
                      </span>
                    )}
                  </button>
                </motion.div>
              )}

              {/* Step 3: Stripe Embedded Checkout */}
              {step === 'payment' && clientSecret && (
                <motion.div
                  key="payment-step"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <StripeCheckoutEmbed clientSecret={clientSecret} />
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <p className="text-red-400 text-sm text-center mt-3">{error}</p>
            )}
          </>
        ) : (
          /* Fallback when Stripe is not configured */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center"
          >
            <Zap className="w-8 h-8 mx-auto mb-3 text-purple-400" />
            <p className="text-zinc-300 font-medium mb-2">Checkout em breve</p>
            <p className="text-zinc-500 text-sm">
              O sistema de pagamento esta sendo configurado. Volte em breve!
            </p>
          </motion.div>
        )}

        {/* Security copy */}
        <div className="mt-6 space-y-2">
          <p className="text-xs text-center text-zinc-500">
            Voce so sera cobrado apos {GAME_CONFIG.FREE_TRIAL_DAYS} dias.
          </p>
          <p className="text-center text-zinc-600 text-xs flex items-center justify-center gap-1">
            <Shield className="w-3 h-3" />
            Pagamento seguro via Stripe
          </p>
        </div>
      </div>
    </main>
  );
}
