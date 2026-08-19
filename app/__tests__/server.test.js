process.env.ADMIN_TOKEN = 'test-admin-token';

const request = require('supertest');
const app = require('../server');

describe('GET /health', () => {
  it('reports ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('GET /api/todos', () => {
  it('returns newest-created todos first', async () => {
    const older = await request(app).post('/api/todos').send({ text: 'older todo' });
    const newer = await request(app).post('/api/todos').send({ text: 'newer todo' });

    const res = await request(app).get('/api/todos');
    const ids = res.body.map((t) => t.id);

    expect(ids.indexOf(newer.body.id)).toBeLessThan(ids.indexOf(older.body.id));
  });
});

describe('POST /api/todos', () => {
  it.each([
    ['no body at all', undefined],
    ['an empty object', {}],
    ['an empty string', { text: '' }],
    ['a whitespace-only string', { text: '   ' }],
    ['a non-string value', { text: 123 }],
  ])('rejects %s with 400, not 500', async (_label, body) => {
    const req = request(app).post('/api/todos');
    const res = body === undefined ? await req : await req.send(body);

    expect(res.status).toBe(400);
  });

  it('creates a todo and returns 201 for valid text', async () => {
    const res = await request(app).post('/api/todos').send({ text: 'Buy milk' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ text: 'Buy milk', completed: false });
    expect(res.body.id).toEqual(expect.any(Number));
  });
});

describe('PUT /api/todos/:id', () => {
  it('toggles completed on an existing id', async () => {
    const created = await request(app).post('/api/todos').send({ text: 'toggle me' });
    const id = created.body.id;

    const first = await request(app).put(`/api/todos/${id}`);
    expect(first.status).toBe(200);
    expect(first.body.completed).toBe(true);

    const second = await request(app).put(`/api/todos/${id}`);
    expect(second.body.completed).toBe(false);
  });

  it('returns 404 for an id that does not exist', async () => {
    const res = await request(app).put('/api/todos/999999');
    expect(res.status).toBe(404);
  });

  it('returns 404 (not a crash) for a non-numeric id', async () => {
    const res = await request(app).put('/api/todos/not-a-number');
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/todos/:id', () => {
  it('deletes the todo with the matching id, not the one at that array position', async () => {
    const a = await request(app).post('/api/todos').send({ text: 'keep me' });
    const b = await request(app).post('/api/todos').send({ text: 'delete me' });

    const del = await request(app).delete(`/api/todos/${b.body.id}`);
    expect(del.status).toBe(204);

    const remaining = await request(app).get('/api/todos');
    const ids = remaining.body.map((t) => t.id);
    expect(ids).toContain(a.body.id);
    expect(ids).not.toContain(b.body.id);
  });

  it('returns 404 when deleting an id that no longer exists', async () => {
    const created = await request(app).post('/api/todos').send({ text: 'one-time delete' });
    await request(app).delete(`/api/todos/${created.body.id}`);

    const res = await request(app).delete(`/api/todos/${created.body.id}`);
    expect(res.status).toBe(404);
  });

  it('returns 404 (not a crash) for a non-numeric id', async () => {
    const res = await request(app).delete('/api/todos/not-a-number');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/debug', () => {
  it('never exposes process.env', async () => {
    const res = await request(app).get('/api/debug');

    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty('env');
    expect(res.body).toEqual(
      expect.objectContaining({
        uptime: expect.any(Number),
        memory: expect.any(Object),
        todoCount: expect.any(Number),
      })
    );
  });
});

describe('POST /api/admin/reset', () => {
  it('rejects a request with no token', async () => {
    const res = await request(app).post('/api/admin/reset');
    expect(res.status).toBe(403);
  });

  it('rejects a request with the wrong token', async () => {
    const res = await request(app)
      .post('/api/admin/reset')
      .set('x-admin-token', 'wrong-token');
    expect(res.status).toBe(403);
  });

  it('clears all todos when given the correct token', async () => {
    await request(app).post('/api/todos').send({ text: 'will be wiped' });

    const res = await request(app)
      .post('/api/admin/reset')
      .set('x-admin-token', process.env.ADMIN_TOKEN);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });

    const remaining = await request(app).get('/api/todos');
    expect(remaining.body).toEqual([]);
  });
});
