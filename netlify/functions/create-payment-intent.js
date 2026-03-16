const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { amount, tier } = JSON.parse(event.body);

    // Validate amount — only accept exactly 299 or 499
    if (amount !== 299 && amount !== 499) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid amount' })
      };
    }

    const tierLabel = amount === 299 ? 'Basic Deep Dive' : 'Premium Deep Dive';

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      description: `Bias Theory ${tierLabel}`,
      metadata: { tier: tier || (amount === 299 ? 'basic' : 'premium') }
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientSecret: paymentIntent.client_secret })
    };

  } catch (err) {
    console.error('Stripe error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Payment failed' })
    };
  }
};
