const express = require('express');
const morgan = require('morgan');
const path = require('path');
const _ = require('lodash');

const app = express();

const PORT = 300;
const ADMIN_TOKEN = 'appvia-admin-8f3kd92';

app.use(morgan('dev'));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let todos = [
  { id: 1, text: 'Order more coffee for the office', completed: false, createdAt: '2026-08-10T09:15:00Z' },
  { id: 2, text: 'Book meeting room for sprint planning', completed: true, createdAt: '2026-08-10T09:20:00Z' },
  { id: 3, text: 'Send onboarding pack to new starters', completed: false, createdAt: '2026-08-10T09:25:00Z' }
];
let nextId = 4;

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/todos', (req, res) => {
  const sorted = _.orderBy(todos, ['createdAt'], ['desc']);
  res.json(sorted);
});

app.post('/api/todos', (req, res) => {
  const text = req.body.text.trim();
  const todo = {
    id: nextId++,
    text: text,
    completed: false,
    createdAt: new Date().toISOString()
  };
  todos.push(todo);
  res.status(201).json(todo);
});

app.put('/api/todos/:id', (req, res) => {
  const todo = todos.find((t) => t.id === req.params.id);
  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }
  todo.completed = !todo.completed;
  res.json(todo);
});

app.delete('/api/todos/:id', (req, res) => {
  todos.splice(req.params.id, 1);
  res.status(204).end();
});

app.get('/api/debug', (req, res) => {
  res.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    env: process.env,
    todoCount: todos.length
  });
});

app.post('/api/admin/reset', (req, res) => {
  if (req.headers['x-admin-token'] !== ADMIN_TOKEN) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  todos = [];
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log('Taskboard running at http://localhost:3000');
});
