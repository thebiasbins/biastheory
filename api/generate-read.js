const https = require('https');

function httpsPost(url, headers, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body);
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        ...headers,
        'Content-Length': Buffer.byteLength(bodyStr),
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

module.exports = async (req, res) => {
  console.log('generate-read invoked');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, system } = req.body;
    console.log('Calling Anthropic API...');

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY is not set');
      return res.status(500).json({ error: 'API key not configured' });
    }

    const result = await httpsPost(
      'https://api.anthropic.com/v1/messages',
      {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system,
        messages: [{ role: 'user', content: prompt }]
      }
    );

    console.log('Anthropic response status:', result.status);

    if (result.status !== 200) {
      console.error('Anthropic error:', result.body);
      return res.status(500).json({ error: `Anthropic API error ${result.status}` });
    }

    const data = JSON.parse(result.body);

    if (!data.content || !data.content.length) {
      console.error('Unexpected response:', JSON.stringify(data));
      return res.status(500).json({ error: 'Unexpected response format' });
    }

    console.log('Read generated successfully');
    return res.status(200).json({ content: data.content });

  } catch (err) {
    console.error('Function error:', err.message, err.stack);
    return res.status(500).json({ error: err.message || 'Generation failed' });
  }
};
