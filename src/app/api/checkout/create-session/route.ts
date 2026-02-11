// ============================================
// DESENROLA - Stripe Create Checkout Session
// Creates/finds customer, captures lead, creates embedded session
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const BACKEND_URL = process.env.BACKEND_URL || 'https://dating-app-production-ac43.up.railway.app';

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-01-28.clover',
  });
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const { priceId, plan, email, name } = await request.json();

    // Validate required fields
    if (!priceId || !email) {
      return NextResponse.json({ error: 'priceId and email are required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Email invalido' }, { status: 400 });
    }

    // Validate priceId against allowed Stripe price IDs
    const validPriceIds = [
      process.env.STRIPE_PRICE_MONTHLY,
      process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY,
      process.env.STRIPE_PRICE_QUARTERLY,
      process.env.NEXT_PUBLIC_STRIPE_PRICE_QUARTERLY,
      process.env.STRIPE_PRICE_YEARLY,
      process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY,
    ].filter(Boolean);

    if (!validPriceIds.includes(priceId)) {
      return NextResponse.json({ error: 'Invalid price ID' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ============================================
    // 1. Get or create Stripe customer
    // ============================================
    let customer: Stripe.Customer;
    const existingCustomers = await stripe.customers.list({
      email: normalizedEmail,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];

      // Check for existing active subscription
      const activeSubscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'active',
        limit: 1,
      });

      if (activeSubscriptions.data.length > 0) {
        return NextResponse.json({
          error: 'Este email ja possui uma assinatura ativa. Faca login no app para acessar.',
          existingSubscription: true,
        }, { status: 400 });
      }

      // Check for trialing subscriptions
      const trialingSubscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'trialing',
        limit: 1,
      });

      if (trialingSubscriptions.data.length > 0) {
        return NextResponse.json({
          error: 'Este email ja possui um periodo de teste ativo. Faca login no app para acessar.',
          existingSubscription: true,
        }, { status: 400 });
      }

      // Update name if provided
      if (name && !customer.name) {
        await stripe.customers.update(customer.id, { name });
      }
    } else {
      customer = await stripe.customers.create({
        email: normalizedEmail,
        name: name || undefined,
        metadata: { source: 'funil_duelo' },
      });
    }

    // ============================================
    // 2. Capture as abandoned lead (fire and forget)
    // ============================================
    fetch(`${BACKEND_URL}/abandoned-lead`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: normalizedEmail,
        name: name || undefined,
        plan: plan || 'monthly',
      }),
    }).catch(err => console.error('Lead capture error:', err));

    // ============================================
    // 3. Create embedded checkout session
    // ============================================
    const origin = request.headers.get('origin') || 'https://desenrolaai.site';

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          plan: plan || 'monthly',
          source: 'funil_duelo',
        },
      },
      metadata: {
        plan: plan || 'monthly',
        email: normalizedEmail,
        name: name || '',
        source: 'funil_duelo',
      },
      ui_mode: 'embedded',
      return_url: origin + '/onboarding?session_id={CHECKOUT_SESSION_ID}',
      allow_promotion_codes: true,
    });

    console.log('Checkout session created:', {
      sessionId: session.id,
      customerId: customer.id,
      email: normalizedEmail,
      plan,
    });

    return NextResponse.json({ clientSecret: session.client_secret }, { status: 200 });
  } catch (error: any) {
    console.error('Stripe session error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
