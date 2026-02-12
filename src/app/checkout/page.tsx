'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Clock, Check, Zap, Mail, ChevronLeft, Lock, CreditCard, BadgePercent } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { useSoundKit } from '@/hooks/useSoundKit';
import { useHaptics } from '@/hooks/useHaptics';
import { useAnalytics } from '@/hooks/useAnalytics';
import { GAME_CONFIG } from '@/constants';
import { metaTrack, metaTrackCustom } from '@/lib/metaTrack';

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
  price: number;
  period: string;
  perMonth: number;
  perMonthDisplay: string;
  totalDisplay: string;
  billingNote: string;
  savings?: number;
  badge?: string;
  priceId: string;
}

const PLANS: Plan[] = [
  {
    id: 'monthly',
    name: 'Mensal',
    price: 29.90,
    period: '/mês',
    perMonth: 29.90,
    perMonthDisplay: 'R$ 29,90',
    totalDisplay: 'R$ 29,90/mês',
    billingNote: 'Cobrado mensalmente',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY || '',
  },
  {
    id: 'quarterly',
    name: 'Trimestral',
    price: 69.90,
    period: '/3 meses',
    perMonth: 23.30,
    perMonthDisplay: 'R$ 23,30',
    totalDisplay: 'R$ 69,90',
    billingNote: 'Cobrado R$ 69,90 a cada 3 meses',
    savings: 22,
    badge: 'Mais popular',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_QUARTERLY || '',
  },
  {
    id: 'yearly',
    name: 'Anual',
    price: 199.90,
    period: '/ano',
    perMonth: 16.66,
    perMonthDisplay: 'R$ 16,66',
    totalDisplay: 'R$ 199,90',
    billingNote: 'Cobrado R$ 199,90 por ano',
    savings: 44,
    badge: 'Melhor valor',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY || '',
  },
];

// ============================================
// EMAIL PERSISTENCE
// ============================================

const EMAIL_STORAGE_KEY = 'desenrola-checkout-email';

function getSavedEmail(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(EMAIL_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

function saveEmail(email: string) {
  try {
    localStorage.setItem(EMAIL_STORAGE_KEY, email);
  } catch {}
}

// ============================================
// STRIPE CHECKOUT WRAPPER
// ============================================

function StripeCheckoutEmbed({ clientSecret }: { clientSecret: string }) {
  if (!stripePromise) return <p className="text-red-400 text-sm text-center">Stripe não configurado</p>;

  return (
    <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
      <EmbeddedCheckout className="rounded-xl overflow-hidden" />
    </EmbeddedCheckoutProvider>
  );
}

// ============================================
// PROGRESS BAR
// ============================================

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-zinc-500">Passo {step} de 2</span>
        <span className="text-xs text-zinc-500">{step === 1 ? 'Escolha seu plano' : 'Pagamento'}</span>
      </div>
      <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: step === 1 ? '50%' : '100%' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// ============================================
// TRUST SIGNALS
// ============================================

function TrustSignals() {
  return (
    <div className="mt-6 space-y-3">
      <div className="flex items-center justify-center gap-4 text-zinc-500">
        <div className="flex items-center gap-1">
          <Shield className="w-3.5 h-3.5" />
          <span className="text-[11px]">Cancele quando quiser</span>
        </div>
        <div className="w-px h-3 bg-zinc-700" />
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          <span className="text-[11px]">Garantia de {GAME_CONFIG.FREE_TRIAL_DAYS} dias</span>
        </div>
      </div>

      <p className="text-center text-zinc-600 text-xs flex items-center justify-center gap-1.5">
        <Lock className="w-3 h-3" />
        Pagamento seguro via Stripe
      </p>

      {/* Payment method logos */}
      <div className="flex items-center justify-center gap-3 opacity-40">
        <CreditCard className="w-5 h-5 text-zinc-500" />
        <span className="text-[10px] text-zinc-500 font-medium tracking-wide">VISA</span>
        <span className="text-[10px] text-zinc-500 font-medium tracking-wide">MASTERCARD</span>
        <span className="text-[10px] text-zinc-500 font-medium tracking-wide">PIX</span>
      </div>
    </div>
  );
}

// ============================================
// CHECKOUT STEPS
// ============================================

type CheckoutStep = 'choose' | 'payment';

// ============================================
// CHECKOUT PAGE
// ============================================

export default function CheckoutPage() {
  const [step, setStep] = useState<CheckoutStep>('choose');
  const [email, setEmail] = useState('');
  const [emailValid, setEmailValid] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('quarterly');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const emailRef = useRef<HTMLInputElement>(null);
  const { play } = useSoundKit();
  const { tap } = useHaptics();
  const { track } = useAnalytics();

  // Load saved email on mount
  useEffect(() => {
    const saved = getSavedEmail();
    if (saved) {
      setEmail(saved);
      setEmailValid(isValidEmail(saved));
      setEmailTouched(true);
    }
  }, []);

  useEffect(() => {
    track('checkout_view');
    // Meta Pixel: InitiateCheckout — 1x por sessao
    if (!sessionStorage.getItem('ic_sent')) {
      metaTrack('InitiateCheckout', { content_name: 'Checkout' });
      sessionStorage.setItem('ic_sent', '1');
    }
  }, [track]);

  // Validate email
  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setError('');
    const valid = isValidEmail(value);
    setEmailValid(valid);
    if (valid) {
      saveEmail(value);
    }
  };

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    setClientSecret(null);
    setError('');
    play('ui-click', { volumeOverride: 0.15, cooldownMs: 120 });
    tap();
    metaTrackCustom('PlanSelected', { plan: planId });
  };

  const handleStartCheckout = useCallback(async () => {
    // Validate email first
    if (!email.trim()) {
      setError('Digite seu e-mail para continuar');
      emailRef.current?.focus();
      return;
    }
    if (!isValidEmail(email)) {
      setError('E-mail inválido');
      emailRef.current?.focus();
      return;
    }

    const plan = PLANS.find((p) => p.id === selectedPlan);
    if (!plan || !plan.priceId) {
      setError('Plano não disponível.');
      return;
    }

    setIsLoading(true);
    setError('');
    play('whoosh', { volumeOverride: 0.25 });
    tap();

    // Save email
    saveEmail(email.toLowerCase().trim());

    try {
      track('checkout_email_entered');

      const res = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: plan.priceId,
          plan: plan.id,
          email: email.toLowerCase().trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.existingSubscription) {
          setError('Este e-mail já possui uma assinatura ativa. Faça login no app para acessar.');
        } else {
          setError(data.error || 'Erro ao iniciar checkout');
        }
        return;
      }

      setClientSecret(data.clientSecret);
      setStep('payment');
      track('checkout_started', { plan: plan.id });
      metaTrack('AddPaymentInfo', {
        content_name: 'Stripe Embedded',
        value: plan.price,
        currency: 'BRL',
      });
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, [email, selectedPlan, play, tap, track]);

  const handleBackToPlans = () => {
    setStep('choose');
    setClientSecret(null);
    play('ui-click', { volumeOverride: 0.15 });
  };

  const activePlans = PLANS.filter((p) => p.priceId);
  const stripeConfigured = stripePromise && activePlans.length > 0;
  const currentPlan = PLANS.find((p) => p.id === selectedPlan);

  return (
    <main className="min-h-screen flex flex-col p-4 py-6">
      <div className="w-full max-w-lg mx-auto">
        {/* Progress bar */}
        <ProgressBar step={step === 'choose' ? 1 : 2} />

        {stripeConfigured ? (
          <AnimatePresence mode="wait">
            {/* ================================ */}
            {/* STEP 1: EMAIL + PLAN SELECTION   */}
            {/* ================================ */}
            {step === 'choose' && (
              <motion.div
                key="choose-step"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {/* Header */}
                <div className="text-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/20"
                  >
                    <Zap className="w-7 h-7 text-white" />
                  </motion.div>
                  <h1 className="text-2xl font-bold text-white mb-1">
                    Ative o Desenrola AI
                  </h1>
                  <p className="text-zinc-400 text-sm">
                    {GAME_CONFIG.FREE_TRIAL_DAYS} dias grátis — sem cobrança hoje
                  </p>
                </div>

                {/* Benefits row */}
                <div className="flex items-center justify-center gap-3 mb-6">
                  {[
                    { icon: Clock, text: `${GAME_CONFIG.FREE_TRIAL_DAYS} dias grátis` },
                    { icon: Shield, text: 'Cancele a qualquer momento' },
                    { icon: Check, text: 'Sem cobrança hoje' },
                  ].map((b, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-zinc-400">
                      <b.icon className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                      <span className="text-[11px]">{b.text}</span>
                    </div>
                  ))}
                </div>

                {/* Email field */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Seu melhor e-mail
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      ref={emailRef}
                      type="email"
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      onBlur={() => setEmailTouched(true)}
                      onKeyDown={(e) => e.key === 'Enter' && handleStartCheckout()}
                      placeholder="seu@email.com"
                      className={
                        'w-full pl-10 pr-10 py-3.5 bg-zinc-900 border rounded-xl text-white placeholder-zinc-600 focus:outline-none transition-colors ' +
                        (emailTouched && email && !emailValid
                          ? 'border-red-500/50 focus:border-red-500'
                          : emailValid
                            ? 'border-green-500/30 focus:border-green-500'
                            : 'border-zinc-800 focus:border-purple-500')
                      }
                      autoComplete="email"
                      autoFocus
                    />
                    {/* Validation indicator */}
                    {emailTouched && email && (
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                        {emailValid ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <span className="text-red-400 text-xs">inválido</span>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1.5 ml-1">
                    Você receberá o acesso neste e-mail
                  </p>
                </div>

                {/* Plan selector */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-zinc-300 mb-3">
                    Escolha seu plano
                  </label>
                  <div className="space-y-2.5">
                    {activePlans.map((plan) => {
                      const isSelected = selectedPlan === plan.id;
                      const isPopular = plan.id === 'quarterly';

                      return (
                        <button
                          key={plan.id}
                          onClick={() => handleSelectPlan(plan.id)}
                          className={
                            'w-full relative flex items-center justify-between p-4 rounded-xl border-2 transition-all ' +
                            (isSelected
                              ? isPopular
                                ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/10'
                                : 'border-purple-500 bg-purple-500/10'
                              : 'border-zinc-800 bg-zinc-900/80 hover:border-zinc-700')
                          }
                        >
                          {/* Badge */}
                          {plan.badge && (
                            <span
                              className={
                                'absolute -top-2.5 left-4 text-[10px] font-bold px-2.5 py-0.5 rounded-full ' +
                                (isPopular
                                  ? 'bg-purple-500 text-white'
                                  : 'bg-zinc-700 text-zinc-300')
                              }
                            >
                              {plan.badge}
                            </span>
                          )}

                          <div className="flex items-center gap-3">
                            {/* Radio */}
                            <div
                              className={
                                'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ' +
                                (isSelected ? 'border-purple-500 bg-purple-500' : 'border-zinc-600')
                              }
                            >
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>

                            {/* Plan info */}
                            <div className="text-left">
                              <div className="flex items-center gap-2">
                                <span className="text-white font-semibold">{plan.name}</span>
                                {plan.savings && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-500/15 text-green-400 flex items-center gap-0.5">
                                    <BadgePercent className="w-2.5 h-2.5" />
                                    -{plan.savings}%
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-zinc-500">{plan.billingNote}</span>
                            </div>
                          </div>

                          {/* Price */}
                          <div className="text-right flex-shrink-0">
                            <div className="text-white font-bold text-lg leading-tight">
                              {plan.perMonthDisplay}
                            </div>
                            <div className="text-[11px] text-zinc-500">/mês</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  onClick={handleStartCheckout}
                  disabled={isLoading}
                  className={
                    'w-full py-4 rounded-xl font-bold text-white text-lg transition-all ' +
                    (isLoading
                      ? 'bg-purple-700 opacity-60 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 active:scale-[0.98] shadow-lg shadow-purple-500/20')
                  }
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Preparando...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Zap className="w-5 h-5" />
                      Começar teste grátis
                    </span>
                  )}
                </button>

                <p className="text-[11px] text-center text-zinc-500 mt-2">
                  Você só será cobrado após {GAME_CONFIG.FREE_TRIAL_DAYS} dias
                </p>

                {/* Error */}
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-sm text-center mt-3 bg-red-500/10 rounded-lg py-2 px-3"
                  >
                    {error}
                  </motion.p>
                )}

                {/* Trust signals */}
                <TrustSignals />
              </motion.div>
            )}

            {/* ================================ */}
            {/* STEP 2: STRIPE PAYMENT           */}
            {/* ================================ */}
            {step === 'payment' && clientSecret && (
              <motion.div
                key="payment-step"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {/* Back button */}
                <button
                  onClick={handleBackToPlans}
                  className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors mb-4"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Alterar plano
                </button>

                {/* Order summary */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold">Desenrola AI — {currentPlan?.name}</p>
                      <p className="text-zinc-500 text-xs mt-0.5">{currentPlan?.billingNote}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">{currentPlan?.perMonthDisplay}<span className="text-zinc-500 text-xs font-normal">/mês</span></p>
                    </div>
                  </div>
                  <div className="border-t border-zinc-800 mt-3 pt-3 flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-xs text-zinc-400">{email}</span>
                  </div>
                </div>

                {/* Stripe Embedded Checkout */}
                <div className="bg-white rounded-2xl p-1 shadow-lg shadow-black/20">
                  <StripeCheckoutEmbed clientSecret={clientSecret} />
                </div>

                {/* Error */}
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-sm text-center mt-3 bg-red-500/10 rounded-lg py-2 px-3"
                  >
                    {error}
                  </motion.p>
                )}

                {/* Trust signals */}
                <TrustSignals />
              </motion.div>
            )}
          </AnimatePresence>
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
              O sistema de pagamento está sendo configurado. Volte em breve!
            </p>
          </motion.div>
        )}
      </div>
    </main>
  );
}
