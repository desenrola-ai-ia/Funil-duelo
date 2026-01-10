'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CreditCard, Check, Shield, Clock } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { ROUTES, UI_TEXTS, GAME_CONFIG } from '@/constants';

// ============================================
// CHECKOUT PAGE
// ============================================

export default function CheckoutPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    cardNumber: '',
    expiry: '',
    cvc: '',
    name: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Redirect to onboarding
    router.push(ROUTES.ONBOARDING);
  };

  const benefits = [
    { icon: Clock, text: `${GAME_CONFIG.FREE_TRIAL_DAYS} dias gratis` },
    { icon: Shield, text: 'Cancele quando quiser' },
    { icon: Check, text: 'Sem cobranca hoje' },
  ];

  return (
    <main className="min-h-screen flex flex-col p-4 py-8">
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">
            {UI_TEXTS.CHECKOUT.TITLE}
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
          className="grid grid-cols-3 gap-2 mb-8"
        >
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="bg-zinc-900 rounded-xl p-3 text-center"
            >
              <benefit.icon className="w-5 h-5 mx-auto mb-2 text-purple-400" />
              <span className="text-xs text-zinc-400">{benefit.text}</span>
            </div>
          ))}
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">
              Email
            </label>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="seu@email.com"
              required
            />
          </div>

          {/* Card section */}
          <div className="bg-zinc-900 rounded-2xl p-4 space-y-4">
            <div className="flex items-center gap-2 text-zinc-400 mb-2">
              <CreditCard className="w-5 h-5" />
              <span className="text-sm font-medium">Dados do cartao</span>
            </div>

            {/* Card holder name */}
            <div>
              <label className="block text-sm font-medium text-zinc-500 mb-1.5">
                Nome no cartao
              </label>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Nome como esta no cartao"
                required
              />
            </div>

            {/* Card number */}
            <div>
              <label className="block text-sm font-medium text-zinc-500 mb-1.5">
                Numero do cartao
              </label>
              <Input
                type="text"
                name="cardNumber"
                value={formData.cardNumber}
                onChange={handleInputChange}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                required
              />
            </div>

            {/* Expiry + CVC */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-zinc-500 mb-1.5">
                  Validade
                </label>
                <Input
                  type="text"
                  name="expiry"
                  value={formData.expiry}
                  onChange={handleInputChange}
                  placeholder="MM/AA"
                  maxLength={5}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-500 mb-1.5">
                  CVC
                </label>
                <Input
                  type="text"
                  name="cvc"
                  value={formData.cvc}
                  onChange={handleInputChange}
                  placeholder="123"
                  maxLength={4}
                  required
                />
              </div>
            </div>
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            size="xl"
            fullWidth
            isLoading={isLoading}
            className="mt-6"
          >
            {UI_TEXTS.BUTTONS.START_FREE_TRIAL}
          </Button>

          {/* Security note */}
          <p className="text-center text-zinc-600 text-xs mt-4 flex items-center justify-center gap-1">
            <Shield className="w-3 h-3" />
            Pagamento seguro e criptografado
          </p>
        </motion.form>
      </div>
    </main>
  );
}
