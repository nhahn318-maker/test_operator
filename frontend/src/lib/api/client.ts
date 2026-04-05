import type {
  ApiErrorEnvelope,
  DashboardResponse,
  SessionPayload,
  Todo,
  TodoInput,
  TodoListResponse,
  TodoPatch,
} from './types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  if (response.status === 204) {
    return undefined as T
  }

  const payload = (await response.json()) as T | ApiErrorEnvelope

  if (!response.ok) {
    const error = payload as ApiErrorEnvelope
    throw new Error(error.error.message)
  }

  return payload as T
}

type DataEnvelope<T> = {
  data: T
}

export const apiClient = {
  async getSession() {
    const response = await request<DataEnvelope<SessionPayload>>('/auth/me')
    return response.data.user
  },

  async login(input: { email: string; password: string }) {
    const response = await request<DataEnvelope<SessionPayload>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return response.data.user
  },

  async register(input: { email: string; password: string; displayName?: string }) {
    const response = await request<DataEnvelope<SessionPayload>>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return response.data.user
  },

  async logout() {
    await request<void>('/auth/logout', {
      method: 'POST',
    })
  },

  async getDashboard() {
    const response = await request<DataEnvelope<DashboardResponse>>('/dashboard')
    return response.data
  },

  async listTodos() {
    const response = await request<DataEnvelope<TodoListResponse>>('/todos')
    return response.data
  },

  async createTodo(input: TodoInput) {
    const response = await request<DataEnvelope<{ todo: Todo }>>('/todos', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return response.data.todo
  },

  async updateTodo(todoId: string, input: TodoPatch) {
    const response = await request<DataEnvelope<{ todo: Todo }>>(`/todos/${todoId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    })
    return response.data.todo
  },

  async deleteTodo(todoId: string) {
    await request<void>(`/todos/${todoId}`, {
      method: 'DELETE',
    })
  },
}
