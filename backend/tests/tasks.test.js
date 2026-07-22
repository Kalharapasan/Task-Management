const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');

const CREDENTIALS = { email: 'admin@test.com', password: '123456' };
let token;

beforeAll(async () => {
  const res = await request(app).post('/api/auth/login').send(CREDENTIALS);
  token = res.body.data.accessToken;
});

afterAll(async () => {
  await pool.end();
});

function authed(req) {
  return req.set('Authorization', `Bearer ${token}`);
}

describe('Task CRUD', () => {
  let createdId;

  it('rejects creating a task without a title', async () => {
    const res = await authed(request(app).post('/api/tasks')).send({
      priority: 'High',
      status: 'Pending',
      due_date: '2099-01-01',
    });
    expect(res.status).toBe(400);
  });

  it('rejects a due date earlier than today', async () => {
    const res = await authed(request(app).post('/api/tasks')).send({
      title: 'Old task',
      priority: 'Low',
      status: 'Pending',
      due_date: '2000-01-01',
    });
    expect(res.status).toBe(400);
  });

  it('creates a task with valid data', async () => {
    const res = await authed(request(app).post('/api/tasks')).send({
      title: 'Write integration tests',
      description: 'Cover the main CRUD flows',
      priority: 'High',
      status: 'Pending',
      due_date: '2099-01-01',
    });

    expect(res.status).toBe(201);
    expect(res.body.data.task.title).toBe('Write integration tests');
    createdId = res.body.data.task.id;
  });

  it('fetches the created task by id', async () => {
    const res = await authed(request(app).get(`/api/tasks/${createdId}`));
    expect(res.status).toBe(200);
    expect(res.body.data.task.id).toBe(createdId);
  });

  it('updates the task', async () => {
    const res = await authed(request(app).put(`/api/tasks/${createdId}`)).send({
      title: 'Write integration tests',
      description: 'Cover the main CRUD flows',
      priority: 'High',
      status: 'Completed',
      due_date: '2099-01-01',
    });

    expect(res.status).toBe(200);
    expect(res.body.data.task.status).toBe('Completed');
  });

  it('returns 404 for a task that does not belong to the user / does not exist', async () => {
    const res = await authed(request(app).get('/api/tasks/999999'));
    expect(res.status).toBe(404);
  });

  it('deletes the task', async () => {
    const res = await authed(request(app).delete(`/api/tasks/${createdId}`));
    expect(res.status).toBe(200);

    const getRes = await authed(request(app).get(`/api/tasks/${createdId}`));
    expect(getRes.status).toBe(404);
  });
});

describe('Search, filter, sort, and pagination', () => {
  beforeAll(async () => {
    // Seed a few predictable tasks for these assertions.
    const tasks = [
      { title: 'Alpha report', priority: 'High', status: 'Pending', due_date: '2099-01-01' },
      { title: 'Beta report', priority: 'Low', status: 'Completed', due_date: '2099-01-02' },
      { title: 'Gamma project', priority: 'Medium', status: 'Pending', due_date: '2099-01-03' },
    ];
    for (const t of tasks) {
      await authed(request(app).post('/api/tasks')).send(t);
    }
  });

  it('filters by search term (title match)', async () => {
    const res = await authed(request(app).get('/api/tasks').query({ search: 'report' }));
    expect(res.status).toBe(200);
    expect(res.body.data.tasks.every((t) => t.title.toLowerCase().includes('report'))).toBe(true);
  });

  it('filters by status and priority combined', async () => {
    const res = await authed(
      request(app).get('/api/tasks').query({ status: 'Pending', priority: 'High' })
    );
    expect(res.status).toBe(200);
    expect(
      res.body.data.tasks.every((t) => t.status === 'Pending' && t.priority === 'High')
    ).toBe(true);
  });

  it('paginates results and returns pagination metadata', async () => {
    const res = await authed(request(app).get('/api/tasks').query({ page: 1, limit: 2 }));
    expect(res.status).toBe(200);
    expect(res.body.data.tasks.length).toBeLessThanOrEqual(2);
    expect(res.body.data.pagination).toEqual(
      expect.objectContaining({ page: 1, limit: 2 })
    );
  });
});

describe('Bulk operations', () => {
  let idsToDelete = [];

  beforeAll(async () => {
    const created = await Promise.all(
      ['Bulk one', 'Bulk two'].map((title) =>
        authed(request(app).post('/api/tasks')).send({
          title,
          priority: 'Low',
          status: 'Pending',
          due_date: '2099-01-01',
        })
      )
    );
    idsToDelete = created.map((res) => res.body.data.task.id);
  });

  it('bulk-updates status for multiple tasks', async () => {
    const res = await authed(request(app).patch('/api/tasks/bulk/status')).send({
      ids: idsToDelete,
      status: 'Completed',
    });

    expect(res.status).toBe(200);
    expect(res.body.data.affected).toBe(idsToDelete.length);
  });

  it('bulk-deletes multiple tasks', async () => {
    const res = await authed(request(app).delete('/api/tasks/bulk')).send({ ids: idsToDelete });

    expect(res.status).toBe(200);
    expect(res.body.data.affected).toBe(idsToDelete.length);
  });

  it('rejects a bulk request with an empty ids array', async () => {
    const res = await authed(request(app).delete('/api/tasks/bulk')).send({ ids: [] });
    expect(res.status).toBe(400);
  });
});

describe('Dashboard stats', () => {
  it('returns the five expected counters', async () => {
    const res = await authed(request(app).get('/api/tasks/stats/dashboard'));
    expect(res.status).toBe(200);
    expect(res.body.data.stats).toEqual(
      expect.objectContaining({
        total: expect.any(Number),
        pending: expect.any(Number),
        inProgress: expect.any(Number),
        completed: expect.any(Number),
        overdue: expect.any(Number),
      })
    );
  });
});
