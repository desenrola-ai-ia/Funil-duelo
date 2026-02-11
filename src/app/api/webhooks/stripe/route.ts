// ============================================
// DESENROLA - Stripe Webhook Handler
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
});

const STORAGE_DIR = path.join(process.cwd(), 'data');
const EVENTS_FILE = path.join(STORAGE_DIR, 'events.jsonl');

async function ensureStorage() {
  if (!existsSync(STORAGE_DIR)) await mkdir(STORAGE_DIR, { recursive: true });
  if (!existsSync(EVENTS_FILE)) await writeFile(EVENTS_FILE, '', 'utf-8');
}

async function logAnalyticsEvent(name: string, userId: string, metadata: Record<string, any>) {
  await ensureStorage();
  const event = {
    name,
    userId,
    sessionId: 'stripe_webhook',
    timestamp: Date.now(),
    page: '/api/webhooks/stripe',
    metadata,
  };
  await writeFile(EVENTS_FILE, JSON.stringify(event) + '\n', { flag: 'a', encoding: 'utf-8' });
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId || 'unknown';
        await logAnalyticsEvent('checkout_complete', userId, {
          stripe_session_id: session.id,
          amount_total: session.amount_total,
          currency: session.currency,
          customer_email: session.customer_details?.email,
          subscription_id: session.subscription,
          payment_status: session.payment_status,
          source: 'stripe_webhook',
        });
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId || 'unknown';
        await logAnalyticsEvent('subscription_created', userId, {
          subscription_id: subscription.id,
          status: subscription.status,
          trial_end: subscription.trial_end,
          plan_id: subscription.items.data[0]?.price?.id,
          source: 'stripe_webhook',
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId || 'unknown';
        await logAnalyticsEvent('subscription_canceled', userId, {
          subscription_id: subscription.id,
          canceled_at: subscription.canceled_at,
          source: 'stripe_webhook',
        });
        break;
      }

      default:
        // Unhandled event type - ignore
        break;
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
