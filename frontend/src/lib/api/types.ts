export type User = {
  id: string
  email: string
  displayName?: string
  createdAt: string
  updatedAt: string
}

export type SessionPayload = {
  user: User
}

export type TodoStatus = 'active' | 'completed'

export type Todo = {
  id: string
  title: string
  description?: string
  status: TodoStatus
  dueDate: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export type TodoInput = {
  title: string
  description?: string
  dueDate?: string | null
}

export type TodoPatch = Partial<TodoInput> & {
  status?: TodoStatus
}

export type TodoListResponse = {
  items: Todo[]
  pageInfo: {
    nextCursor: string | null
  }
}

export type DashboardResponse = {
  summary: {
    totalTodos: number
    activeTodos: number
    completedTodos: number
  }
  highPriorityTodos: Todo[]
}

export type ApiErrorEnvelope = {
  error: {
    code: string
    message: string
    details: Array<{
      field: string
      issue: string
    }>
    requestId: string
  }
}
