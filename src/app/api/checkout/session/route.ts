// ============================================
// DESENROLA - Get Checkout Session Info
// Used by onboarding page to display customer email
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-01-28.clover',
  });
}

export async function GET(request: NextRequest) {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const sessionId = request.nextUrl.searchParams.get('session_id');
    if (!sessionId) {
      return NextResponse.json({ error: 'session_id is required' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });

    // Extrair valor e status da subscription
    const sub = session.subscription as Stripe.Subscription | null;
    const subStatus = sub?.status; // active, trialing, etc.
    const amountTotal = session.amount_total; // em centavos

    return NextResponse.json({
      email: session.customer_email || session.customer_details?.email,
      status: session.payment_status,
      subscriptionStatus: subStatus || null,
      plan: session.metadata?.plan,
      amountTotal: amountTotal ?? null,
      currency: session.currency || 'brl',
    });
  } catch (error: any) {
    console.error('Session retrieve error:', error.message);
    return NextResponse.json({ error: 'Failed to get session' }, { status: 500 });
  }
}
