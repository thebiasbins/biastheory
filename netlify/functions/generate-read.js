exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { prompt, system } = JSON.parse(event.body);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error('Anthropic API error status:', response.status);
      console.error('Anthropic API error body:', responseText);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: `Anthropic API error ${response.status}: ${responseText}` })
      };
    }

    const data = JSON.parse(responseText);

    if (!data.content || !data.content.length) {
      console.error('Unexpected Anthropic response:', JSON.stringify(data));
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Unexpected response format from Anthropic' })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: data.content })
    };

  } catch (err) {
    console.error('Function error:', err.message, err.stack);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Generation failed' })
    };
  }
};
