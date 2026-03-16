const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { amount, tier, quizData } = JSON.parse(event.body);

    // Validate amount — only accept exactly 299 or 499
    if (amount !== 299 && amount !== 499) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid amount' })
      };
    }

    const tierLabel = amount === 299 ? 'Basic Deep Dive' : 'Premium Deep Dive';

    // ── Log quiz data so we can manually recreate any failed read ──
    console.log('DEEP DIVE PURCHASE:', JSON.stringify({
      tier: tierLabel,
      amount: `$${(amount/100).toFixed(2)}`,
      timestamp: new Date().toISOString(),
      member: quizData?.memberName || 'unknown',
      group: quizData?.groupName || 'unknown',
      archetype: quizData?.archetype || 'unknown',
      isDual: quizData?.isDual || false,
      aspireMember: quizData?.aspireMemberName || null,
      aspireArch: quizData?.aspireArch || null,
      dimScores: quizData?.dimScores || {},
      topAnswers: quizData?.topAnswers || [],
      isMirror: quizData?.isMirror || false,
      mirrorScore: quizData?.mirrorScore || 0,
      aspireScore: quizData?.aspireScore || 0,
    }));

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      description: `Bias Theory ${tierLabel}`,
      metadata: {
        tier: tier || (amount === 299 ? 'basic' : 'premium'),
        member: quizData?.memberName || 'unknown',
        group: quizData?.groupName || 'unknown',
        archetype: quizData?.archetype || 'unknown',
        isDual: quizData?.isDual ? 'true' : 'false',
        aspireMember: quizData?.aspireMemberName || '',
      }
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
