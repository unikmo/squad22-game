import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { verifyStripeSignature } from '../lib/squad22/stripeServer';

const secret = 'whsec_squad22_regression_secret';
const payload = JSON.stringify({ type: 'checkout.session.completed', data: { object: { id: 'cs_test_123' } } });
const timestamp = Math.floor(Date.now() / 1000);
const signature = createHmac('sha256', secret).update(`${timestamp}.${payload}`, 'utf8').digest('hex');

assert.equal(verifyStripeSignature(payload, `t=${timestamp},v1=${signature}`, secret), true, 'valid Stripe signature must verify');
assert.equal(verifyStripeSignature(payload + 'x', `t=${timestamp},v1=${signature}`, secret), false, 'tampered payload must fail');
assert.equal(verifyStripeSignature(payload, `t=${timestamp},v1=${'0'.repeat(64)}`, secret), false, 'wrong signature must fail');
assert.equal(verifyStripeSignature(payload, `t=${timestamp - 1000},v1=${signature}`, secret), false, 'stale signature must fail tolerance check');

console.log('Stripe webhook signature regression suite passed: 4 assertions');
