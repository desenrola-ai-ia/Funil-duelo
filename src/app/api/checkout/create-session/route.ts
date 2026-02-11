// ============================================
// DESENROLA - Stripe Create Checkout Session
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

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

    const { priceId, userId } = await request.json();

    const validPriceIds = [
      process.env.STRIPE_PRICE_MONTHLY,
      process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY,
      process.env.STRIPE_PRICE_QUARTERLY,
      process.env.NEXT_PUBLIC_STRIPE_PRICE_QUARTERLY,
      process.env.STRIPE_PRICE_YEARLY,
      process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY,
    ].filter(Boolean);

    if (!priceId || !validPriceIds.includes(priceId)) {
      return NextResponse.json({ error: 'Invalid price ID' }, { status: 400 });
    }

    const origin = request.headers.get('origin') || 'https://desenrolaai.site';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 7,
        metadata: { userId: userId || 'unknown' },
      },
      metadata: { userId: userId || 'unknown' },
      ui_mode: 'embedded',
      return_url: origin + '/onboarding?session_id={CHECKOUT_SESSION_ID}',
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
