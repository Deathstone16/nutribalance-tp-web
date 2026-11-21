import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

async function moduleAt(path) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return import(
    'data:text/javascript;base64,' +
      Buffer.from(code).toString('base64') +
      '#' +
      crypto.randomUUID()
  );
}
const session = {
  user: {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'professional@example.test',
    role: 'professional',
  },
  csrfToken: 'rotated-token',
  expiresAt: '2026-10-27T00:00:00Z',
};

test('login uses the anonymous CSRF, then rotated CSRF; logout handles 204 and clears it', async (t) => {
  const api = await moduleAt('../lib/express-api.ts'),
    calls = [];
  t.mock.method(globalThis, 'fetch', async (path, options) => {
    calls.push({ path, ...options });
    if (path.endsWith('/auth/csrf')) return Response.json({ csrfToken: 'anonymous-token' });
    if (path.endsWith('/auth/login')) return Response.json(session);
    if (path.endsWith('/auth/logout')) return new Response(null, { status: 204 });
    return Response.json({ id: 'patient-id' }, { status: 201 });
  });
  await api.login('professional@example.test', 'test-password-only');
  await api.createPatient({ firstName: 'Ana', lastName: 'Ejemplo', phone: '0000000000' });
  assert.equal(calls[1].headers['X-CSRF-Token'], 'anonymous-token');
  assert.equal(calls[2].headers['X-CSRF-Token'], 'rotated-token');
  assert.ok(calls.every((call) => call.credentials === 'include' && call.cache === 'no-store'));
  await api.logout();
  await api.requestAppointment({
    contactName: 'Ana Ejemplo',
    contactPhone: '0000000000',
    contactEmail: 'ana@example.test',
    contactDocumentNumber: '30111222',
    startsAt: '2026-10-27T12:00:00Z',
  });
  assert.equal(calls.filter((call) => call.path.endsWith('/auth/csrf')).length, 2);
});

test('a CSRF failure refreshes the token without repeating a creation', async (t) => {
  const api = await moduleAt('../lib/express-api.ts');
  let writes = 0,
    tokens = 0;
  t.mock.method(globalThis, 'fetch', async (path) => {
    if (path.endsWith('/auth/csrf')) {
      tokens++;
      return Response.json({ csrfToken: 'token-' + tokens });
    }
    writes++;
    return Response.json(
      { error: { code: 'CSRF_INVALID', message: 'csrf', details: [] } },
      { status: 403 },
    );
  });
  await assert.rejects(api.requestAppointment({}), (e) => e.code === 'CSRF_INVALID');
  assert.equal(writes, 1);
  assert.equal(tokens, 2);
});

test('slot conflicts, field errors and rate limits retain structured recovery information', async (t) => {
  const api = await moduleAt('../lib/express-api.ts');
  t.mock.method(globalThis, 'fetch', async () =>
    Response.json(
      {
        error: {
          code: 'SLOT_UNAVAILABLE',
          message: 'occupied',
          details: [{ field: 'startsAt', message: 'Elegí otro horario.' }],
        },
      },
      { status: 409, headers: { 'Retry-After': '15' } },
    ),
  );
  await assert.rejects(
    api.availability('2026-10-27'),
    (e) =>
      e.status === 409 &&
      e.code === 'SLOT_UNAVAILABLE' &&
      e.details[0].field === 'startsAt' &&
      e.retryAfter === 15,
  );
  assert.equal(api.localTime('2026-10-27T12:00:00.000Z'), '09:00');
  assert.equal(api.addDays('2026-12-31', 1), '2027-01-01');
});

test('a rate limit prevents another write until Retry-After has elapsed', async (t) => {
  const api = await moduleAt('../lib/express-api.ts');
  let writes = 0;
  t.mock.method(globalThis, 'fetch', async (path) => {
    if (path.endsWith('/auth/csrf')) return Response.json({ csrfToken: 'test-token' });
    writes++;
    return Response.json(
      { error: { code: 'RATE_LIMITED', details: [] } },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  });
  await assert.rejects(api.createPatient({}), (e) => e.status === 429);
  await assert.rejects(api.createPatient({}), (e) => e.status === 429 && e.retryAfter > 0);
  assert.equal(writes, 1);
});

test('the gateway rejects foreign origins, unknown paths and unsupported methods before forwarding', async (t) => {
  const { forwardExpress } = await moduleAt('../lib/server/express-gateway.ts');
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    calls++;
    throw new Error('must not fetch');
  });
  assert.equal(
    (
      await forwardExpress(
        new Request('https://nutri.test/api/v1/auth/login', {
          method: 'POST',
          headers: { Origin: 'https://other.test' },
        }),
      )
    ).status,
    403,
  );
  assert.equal((await forwardExpress(new Request('https://nutri.test/api/v1/admin'))).status, 404);
  assert.equal(
    (await forwardExpress(new Request('https://nutri.test/api/v1/patients', { method: 'DELETE' })))
      .status,
    405,
  );
  assert.equal(calls, 0);
});

test('the gateway forwards only backend session and CSRF, scopes cookies and never follows redirects', async (t) => {
  const { forwardExpress } = await moduleAt('../lib/server/express-gateway.ts');
  let received;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    received = { url, ...options };
    return Response.json(session, {
      headers: {
        'Set-Cookie':
          'nutri.sid=backend-session; Domain=api.neadev.com; Path=/; HttpOnly; Secure; SameSite=None',
      },
    });
  });
  const response = await forwardExpress(
    new Request('https://nutri.test/api/v1/auth/login', {
      method: 'POST',
      headers: {
        Origin: 'https://nutri.test',
        Cookie: 'platform-secret=private; nutri.sid=backend-session; other=value',
        'X-CSRF-Token': 'test-csrf',
        'Content-Type': 'application/json',
        'oai-authenticated-user-email': 'private@example.test',
      },
      body: '{}',
    }),
  );
  assert.equal(received.url, 'https://api.neadev.com/api/v1/auth/login');
  assert.equal(received.headers.get('Cookie'), 'nutri.sid=backend-session');
  assert.equal(received.headers.get('oai-authenticated-user-email'), null);
  assert.equal(received.headers.get('X-CSRF-Token'), 'test-csrf');
  assert.equal(received.redirect, 'manual');
  const cookie = response.headers.get('set-cookie');
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Secure/);
  assert.match(cookie, /SameSite=Lax/);
  assert.match(cookie, /Path=\/api\/v1/);
  assert.doesNotMatch(cookie, /Domain=/);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
});

test('the Render gateway checks the browser origin before sending the backend allowlisted origin', async (t) => {
  const previous = process.env.EXPRESS_ALLOWED_ORIGIN;
  process.env.EXPRESS_ALLOWED_ORIGIN = 'https://nutribalance-mauricio.maauri.chatgpt.site';
  t.after(() => {
    if (previous === undefined) delete process.env.EXPRESS_ALLOWED_ORIGIN;
    else process.env.EXPRESS_ALLOWED_ORIGIN = previous;
  });
  const { forwardExpress } = await moduleAt('../lib/server/express-gateway.ts');
  let upstreamOrigin;
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    upstreamOrigin = options.headers.get('Origin');
    return Response.json({ csrfToken: 'test-token' });
  });
  const base = 'https://nutribalance-mauricio.onrender.com/api/v1/auth/login';
  const rejected = await forwardExpress(
    new Request(base, {
      method: 'POST',
      headers: { Origin: 'https://other.test', 'Content-Type': 'application/json' },
      body: '{}',
    }),
  );
  assert.equal(rejected.status, 403);
  assert.equal(upstreamOrigin, undefined);
  const accepted = await forwardExpress(
    new Request(base, {
      method: 'POST',
      headers: {
        Origin: 'https://nutribalance-mauricio.onrender.com',
        'Content-Type': 'application/json',
      },
      body: '{}',
    }),
  );
  assert.equal(accepted.status, 200);
  assert.equal(upstreamOrigin, 'https://nutribalance-mauricio.maauri.chatgpt.site');
});

test('the gateway preserves 204 logout and turns unavailable upstream responses into recoverable errors', async (t) => {
  const { forwardExpress } = await moduleAt('../lib/server/express-gateway.ts');
  t.mock.method(
    globalThis,
    'fetch',
    async () =>
      new Response(null, {
        status: 204,
        headers: { 'Set-Cookie': 'nutri.sid=; Path=/; Max-Age=0; HttpOnly; Secure' },
      }),
  );
  const out = await forwardExpress(
    new Request('https://nutri.test/api/v1/auth/logout', {
      method: 'POST',
      headers: { Origin: 'https://nutri.test' },
    }),
  );
  assert.equal(out.status, 204);
  assert.equal(await out.text(), '');
  assert.match(out.headers.get('set-cookie'), /Max-Age=0/);
  globalThis.fetch.mock.mockImplementation(
    async () => new Response('cloudflare error', { status: 530 }),
  );
  const unavailable = await forwardExpress(new Request('https://nutri.test/api/v1/auth/csrf'));
  assert.equal(unavailable.status, 502);
  assert.equal((await unavailable.json()).error.code, 'UPSTREAM_UNAVAILABLE');
});

test('Cloudflare Access uses server credentials and never exposes or accepts browser credentials', async (t) => {
  const keys = ['CF_ACCESS_CLIENT_ID', 'CF_ACCESS_CLIENT_SECRET'];
  const previous = keys.map((key) => process.env[key]);
  t.after(() =>
    keys.forEach((key, index) => {
      if (previous[index] === undefined) delete process.env[key];
      else process.env[key] = previous[index];
    }),
  );
  process.env.CF_ACCESS_CLIENT_ID = 'service-test-id';
  process.env.CF_ACCESS_CLIENT_SECRET = 'service-test-secret';
  const { forwardExpress } = await moduleAt('../lib/server/express-gateway.ts');
  let forwarded;
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    forwarded = options.headers;
    return Response.json({ csrfToken: 'test-token' });
  });
  const response = await forwardExpress(
    new Request('https://nutri.test/api/v1/auth/csrf', {
      headers: { 'CF-Access-Client-Id': 'browser-id', 'CF-Access-Client-Secret': 'browser-secret' },
    }),
  );
  assert.equal(response.status, 200);
  assert.equal(forwarded.get('CF-Access-Client-Id'), 'service-test-id');
  assert.equal(forwarded.get('CF-Access-Client-Secret'), 'service-test-secret');
  assert.equal(response.headers.get('CF-Access-Client-Secret'), null);
  assert.doesNotMatch(await response.text(), /service-test-secret|browser-secret/);
  delete process.env.CF_ACCESS_CLIENT_ID;
  delete process.env.CF_ACCESS_CLIENT_SECRET;
  await forwardExpress(
    new Request('https://nutri.test/api/v1/auth/csrf', {
      headers: { 'CF-Access-Client-Secret': 'browser-secret' },
    }),
  );
  assert.equal(forwarded.get('CF-Access-Client-Secret'), null);
});

test('an incomplete Access configuration fails before contacting the API', async (t) => {
  const keys = ['CF_ACCESS_CLIENT_ID', 'CF_ACCESS_CLIENT_SECRET'];
  const previous = keys.map((key) => process.env[key]);
  t.after(() =>
    keys.forEach((key, index) => {
      if (previous[index] === undefined) delete process.env[key];
      else process.env[key] = previous[index];
    }),
  );
  const { forwardExpress } = await moduleAt('../lib/server/express-gateway.ts');
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    calls++;
    throw new Error('must not fetch');
  });
  for (const configured of keys) {
    for (const key of keys) delete process.env[key];
    process.env[configured] = 'test-value';
    const response = await forwardExpress(new Request('https://nutri.test/api/v1/auth/csrf'));
    assert.equal(response.status, 503);
    assert.equal((await response.json()).error.code, 'GATEWAY_MISCONFIGURED');
  }
  assert.equal(calls, 0);
});

test('retired D1 endpoints return an explicit non-cacheable response', async () => {
  const { legacyApiDisabled } = await moduleAt('../lib/server/legacy-api.ts');
  const response = legacyApiDisabled();
  assert.equal(response.status, 410);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal((await response.json()).error.code, 'LEGACY_API_DISABLED');
});

test('the local exhibition reaches Express directly and preserves HTTPS session semantics', async (t) => {
  const previous = process.env.EXPRESS_LOCAL_API_ORIGIN;
  process.env.EXPRESS_LOCAL_API_ORIGIN = 'http://127.0.0.1:3001';
  t.after(() => {
    if (previous === undefined) delete process.env.EXPRESS_LOCAL_API_ORIGIN;
    else process.env.EXPRESS_LOCAL_API_ORIGIN = previous;
  });
  const { forwardExpress } = await moduleAt('../lib/server/express-gateway.ts');
  let received;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    received = { url, ...options };
    return Response.json({ csrfToken: 'test-token' });
  });
  const response = await forwardExpress(
    new Request('https://api.neadev.com/api/v1/auth/csrf', {
      headers: { 'X-Forwarded-Proto': 'http', 'X-Forwarded-For': '198.51.100.1' },
    }),
  );
  assert.equal(response.status, 200);
  assert.equal(received.url, 'http://127.0.0.1:3001/api/v1/auth/csrf');
  assert.equal(received.headers.get('X-Forwarded-Proto'), 'https');
  assert.equal(received.headers.get('X-Forwarded-For'), null);
});

test('local API configuration rejects external targets, credentials and paths', async (t) => {
  const previous = process.env.EXPRESS_LOCAL_API_ORIGIN;
  t.after(() => {
    if (previous === undefined) delete process.env.EXPRESS_LOCAL_API_ORIGIN;
    else process.env.EXPRESS_LOCAL_API_ORIGIN = previous;
  });
  const { forwardExpress } = await moduleAt('../lib/server/express-gateway.ts');
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    calls++;
    throw new Error('must not fetch');
  });
  for (const origin of [
    'http://example.test:3001',
    'http://127.0.0.1:3001/path',
    'http://user:password@127.0.0.1:3001',
    'http://127.0.0.1:3001?target=other',
  ]) {
    process.env.EXPRESS_LOCAL_API_ORIGIN = origin;
    const response = await forwardExpress(new Request('https://api.neadev.com/api/v1/auth/csrf'));
    assert.equal(response.status, 503);
    assert.equal((await response.json()).error.code, 'GATEWAY_MISCONFIGURED');
  }
  assert.equal(calls, 0);
});

test('Tunnel writes use the configured HTTPS origin despite the internal HTTP listener', async (t) => {
  const keys = ['EXPRESS_LOCAL_API_ORIGIN', 'PUBLIC_SITE_ORIGIN'];
  const previous = keys.map((key) => process.env[key]);
  t.after(() =>
    keys.forEach((key, index) => {
      if (previous[index] === undefined) delete process.env[key];
      else process.env[key] = previous[index];
    }),
  );
  process.env.EXPRESS_LOCAL_API_ORIGIN = 'http://127.0.0.1:3001';
  process.env.PUBLIC_SITE_ORIGIN = 'https://api.neadev.com';
  const { forwardExpress } = await moduleAt('../lib/server/express-gateway.ts');
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    calls++;
    return Response.json(session);
  });
  const options = {
    method: 'POST',
    headers: { Origin: 'https://api.neadev.com', 'Content-Type': 'application/json' },
    body: '{}',
  };
  assert.equal(
    (await forwardExpress(new Request('http://localhost:3000/api/v1/auth/login', options))).status,
    200,
  );
  options.headers.Origin = 'https://foreign.test';
  assert.equal(
    (await forwardExpress(new Request('http://localhost:3000/api/v1/auth/login', options))).status,
    403,
  );
  assert.equal(calls, 1);
});

test('email confirmation posts the token with CSRF and surfaces expired links', async (t) => {
  const api = await moduleAt('../lib/express-api.ts'),
    token = 'a'.repeat(43),
    calls = [];
  let expired = false;
  t.mock.method(globalThis, 'fetch', async (path, options) => {
    calls.push({ path, ...options });
    if (path.endsWith('/auth/csrf')) return Response.json({ csrfToken: 'visitor-token' });
    if (expired)
      return Response.json(
        { error: { code: 'CONFIRMATION_EXPIRED', message: 'El enlace venció.', details: [] } },
        { status: 409 },
      );
    return Response.json({
      emailConfirmed: true,
      alreadyConfirmed: false,
      startsAt: '2026-10-27T12:00:00Z',
      endsAt: '2026-10-27T12:30:00Z',
      status: 'pending',
    });
  });
  const result = await api.confirmEmail(token);
  assert.equal(result.emailConfirmed, true);
  const post = calls.find((call) => call.path.endsWith('/appointment-requests/confirm-email'));
  assert.equal(post.method, 'POST');
  assert.equal(post.headers['X-CSRF-Token'], 'visitor-token');
  assert.deepEqual(JSON.parse(post.body), { token });
  expired = true;
  await assert.rejects(api.confirmEmail(token), (error) => {
    assert.equal(error.code, 'CONFIRMATION_EXPIRED');
    assert.equal(error.status, 409);
    return true;
  });
});
