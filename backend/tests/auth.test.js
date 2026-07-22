const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');

const CREDENTIALS = { email: 'admin@test.com', password: '123456' };

afterAll(async () => {
  await pool.end();
});

describe('POST /api/auth/login', () => {
  it('rejects a missing password with a 400 validation error', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: CREDENTIALS.email });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects invalid credentials with a 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: CREDENTIALS.email, password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('logs in with the seeded default credentials and returns an access token', async () => {
    const res = await request(app).post('/api/auth/login').send(CREDENTIALS);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.body.data.user.email).toBe(CREDENTIALS.email);

    // A refresh token cookie should be set alongside the access token.
    const setCookie = res.headers['set-cookie'] || [];
    expect(setCookie.some((c) => c.startsWith('refreshToken='))).toBe(true);
  });
});

describe('GET /api/auth/me', () => {
  it('rejects a request with no Authorization header', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns the current user for a valid access token', async () => {
    const loginRes = await request(app).post('/api/auth/login').send(CREDENTIALS);
    const token = loginRes.body.data.accessToken;

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(CREDENTIALS.email);
  });
});

describe('Refresh token lifecycle', () => {
  it('issues a new access token via the refresh cookie, then invalidates it on logout', async () => {
    const agent = request.agent(app);

    const loginRes = await agent.post('/api/auth/login').send(CREDENTIALS);
    expect(loginRes.status).toBe(200);

    const refreshRes = await agent.post('/api/auth/refresh');
    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data.accessToken).toEqual(expect.any(String));

    const logoutRes = await agent.post('/api/auth/logout');
    expect(logoutRes.status).toBe(200);

    const refreshAfterLogout = await agent.post('/api/auth/refresh');
    expect(refreshAfterLogout.status).toBe(401);
  });
});
