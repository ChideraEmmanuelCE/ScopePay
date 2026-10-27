import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/app.js';

test('Vercel routing preserves status, origin checks, and sandbox return URL', async () => {
  const previousFetch = globalThis.fetch;
  const saved = { id: process.env.PAYPAL_CLIENT_ID, secret: process.env.PAYPAL_CLIENT_SECRET };
  process.env.PAYPAL_CLIENT_ID = 'test';
  process.env.PAYPAL_CLIENT_SECRET = 'test-only';
  try {
    const status = await handler.fetch(new Request('https://scopepay.test/api/app?route=status'));
    assert.equal((await status.json()).mode, 'sandbox');
    const quote = { title: 'Test', rate: 1, items: [{ name: 'Task', hours: 1 }] };
    const req = origin => new Request('https://scopepay.test/api/app?route=orders', {
      method: 'POST', headers: { origin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ quote, approved: true }),
    });
    assert.equal((await handler.fetch(req('https://other.test'))).status, 403);
    globalThis.fetch = async (url, options) => {
      assert.ok(url.startsWith('https://api-m.sandbox.paypal.com/'));
      if (url.endsWith('/token')) return Response.json({ access_token: 'test' });
      const data = JSON.parse(options.body);
      assert.equal(data.payment_source.paypal.experience_context.return_url, 'https://scopepay.test/?checkout=return');
      assert.equal(data.purchase_units[0].amount.value, '1.00');
      return Response.json({ id: 'TEST', links: [{ rel: 'approve', href: 'https://www.sandbox.paypal.com/checkoutnow?token=TEST' }] });
    };
    assert.equal((await handler.fetch(req('https://scopepay.test'))).status, 200);
  } finally {
    globalThis.fetch = previousFetch;
    for (const [key, value] of [['PAYPAL_CLIENT_ID', saved.id], ['PAYPAL_CLIENT_SECRET', saved.secret]]) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
