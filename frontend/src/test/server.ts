import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import type { DashboardResponse, Todo, User } from '../lib/api/types'

const user: User = {
  id: 'user-1',
  email: 'user@example.com',
  displayName: 'Alex Doe',
  createdAt: '2026-04-05T10:00:00Z',
  updatedAt: '2026-04-05T10:00:00Z',
}

let isAuthenticated = true
let todos: Todo[] = [
  {
    id: 'todo-1',
    title: 'Finish architecture draft',
    description: 'Complete HLD and API contract documents.',
    status: 'active',
    dueDate: '2026-04-10T00:00:00Z',
    completedAt: null,
    createdAt: '2026-04-05T10:30:00Z',
    updatedAt: '2026-04-05T10:30:00Z',
  },
]

function buildDashboard(): DashboardResponse {
  return {
    summary: {
      totalTodos: todos.length,
      activeTodos: todos.filter((todo) => todo.status === 'active').length,
      completedTodos: todos.filter((todo) => todo.status === 'completed').length,
    },
    highPriorityTodos: [...todos]
      .sort((left, right) => left.title.localeCompare(right.title))
      .slice(0, 5),
  }
}

function unauthenticatedResponse() {
  return HttpResponse.json(
    {
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Authentication is required.',
        details: [],
        requestId: 'req_456',
      },
    },
    { status: 401 },
  )
}

export const server = setupServer(
  http.get('/api/v1/auth/me', () => {
    if (!isAuthenticated) {
      return unauthenticatedResponse()
    }

    return HttpResponse.json({ data: { user } })
  }),
  http.post('/api/v1/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string }

    if (!body.email || !body.password) {
      return HttpResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request body is invalid.',
            details: [],
            requestId: 'req_123',
          },
        },
        { status: 400 },
      )
    }

    isAuthenticated = true
    return HttpResponse.json({ data: { user } })
  }),
  http.post('/api/v1/auth/register', async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string; displayName?: string }
    isAuthenticated = true

    return HttpResponse.json(
      {
        data: {
          user: {
            ...user,
            email: body.email,
            displayName: body.displayName ?? user.displayName,
          },
        },
      },
      { status: 201 },
    )
  }),
  http.post('/api/v1/auth/logout', () => {
    isAuthenticated = false
    return new HttpResponse(null, { status: 204 })
  }),
  http.get('/api/v1/dashboard', () => {
    if (!isAuthenticated) {
      return unauthenticatedResponse()
    }

    return HttpResponse.json({ data: buildDashboard() })
  }),
  http.get('/api/v1/todos', () => {
    if (!isAuthenticated) {
      return unauthenticatedResponse()
    }

    return HttpResponse.json({
      data: {
        items: todos,
        pageInfo: { nextCursor: null },
      },
    })
  }),
  http.post('/api/v1/todos', async ({ request }) => {
    const body = (await request.json()) as { title: string; description?: string; dueDate?: string | null }
    const now = '2026-04-05T11:00:00Z'
    const todo: Todo = {
      id: crypto.randomUUID(),
      title: body.title,
      description: body.description,
      status: 'active',
      dueDate: body.dueDate ?? null,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    }

    todos = [todo, ...todos]
    return HttpResponse.json({ data: { todo } }, { status: 201 })
  }),
  http.patch('/api/v1/todos/:todoId', async ({ params, request }) => {
    const body = (await request.json()) as {
      title?: string
      description?: string
      dueDate?: string | null
      status?: Todo['status']
    }

    todos = todos.map((todo) =>
      todo.id === params.todoId
        ? {
            ...todo,
            title: body.title ?? todo.title,
            description: body.description ?? todo.description,
            dueDate: body.dueDate === undefined ? todo.dueDate : body.dueDate,
            status: body.status ?? todo.status,
            completedAt:
              body.status === 'completed'
                ? '2026-04-05T11:05:00Z'
                : body.status === 'active'
                  ? null
                  : todo.completedAt,
            updatedAt: '2026-04-05T11:05:00Z',
          }
        : todo,
    )

    const todo = todos.find((item) => item.id === params.todoId)
    return HttpResponse.json({ data: { todo } })
  }),
  http.delete('/api/v1/todos/:todoId', ({ params }) => {
    todos = todos.filter((todo) => todo.id !== params.todoId)
    return new HttpResponse(null, { status: 204 })
  }),
)

export function resetMockState(next?: { authenticated?: boolean; initialTodos?: Todo[] }) {
  isAuthenticated = next?.authenticated ?? true
  todos =
    next?.initialTodos ?? [
      {
        id: 'todo-1',
        title: 'Finish architecture draft',
        description: 'Complete HLD and API contract documents.',
        status: 'active',
        dueDate: '2026-04-10T00:00:00Z',
        completedAt: null,
        createdAt: '2026-04-05T10:30:00Z',
        updatedAt: '2026-04-05T10:30:00Z',
      },
    ]
}
