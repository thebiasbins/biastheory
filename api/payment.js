const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, tier, quizData } = req.body;

    if (amount !== 299 && amount !== 499) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const tierLabel = amount === 299 ? 'Basic Deep Dive' : 'Premium Deep Dive';

    console.log('DEEP DIVE PURCHASE:', JSON.stringify({
      tier: tierLabel,
      amount: `$${(amount / 100).toFixed(2)}`,
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

    return res.status(200).json({ clientSecret: paymentIntent.client_secret });

  } catch (err) {
    console.error('Stripe error:', err);
    return res.status(500).json({ error: err.message || 'Payment failed' });
  }
};
