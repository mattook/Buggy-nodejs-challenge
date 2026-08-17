const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const list = document.getElementById('todo-list');
const statusLine = document.getElementById('status');

function setStatus(message) {
  statusLine.textContent = message || '';
}

async function loadTodos() {
  const res = await fetch('/api/todos');
  if (!res.ok) {
    setStatus('Failed to load todos (HTTP ' + res.status + ')');
    return;
  }
  const todos = await res.json();
  list.innerHTML = '';
  for (const todo of todos) {
    const li = document.createElement('li');
    li.className = todo.completed ? 'todo completed' : 'todo';
    li.innerHTML =
      '<span class="text">' + todo.text + '</span>' +
      '<span class="actions">' +
      '<button class="toggle" data-id="' + todo.id + '">Done</button>' +
      '<button class="delete" data-id="' + todo.id + '">Delete</button>' +
      '</span>';
    list.appendChild(li);
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  setStatus('');
  const res = await fetch('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: input.value })
  });
  if (!res.ok) {
    setStatus('Failed to add todo (HTTP ' + res.status + ')');
    return;
  }
  input.value = '';
  loadTodos();
});

list.addEventListener('click', async (event) => {
  const id = event.target.dataset.id;
  if (!id) return;
  setStatus('');

  if (event.target.classList.contains('toggle')) {
    const res = await fetch('/api/todos/' + id, { method: 'PUT' });
    if (!res.ok) {
      setStatus('Failed to update todo (HTTP ' + res.status + ')');
      return;
    }
    loadTodos();
  }

  if (event.target.classList.contains('delete')) {
    const res = await fetch('/api/todos/' + id, { method: 'DELETE' });
    if (!res.ok) {
      setStatus('Failed to delete todo (HTTP ' + res.status + ')');
      return;
    }
    loadTodos();
  }
});

loadTodos();
