import { useEffect, useState } from 'react'
import { Shell } from '../../components/Shell'
import { SummaryCard } from '../../components/SummaryCard'
import { TodoEditor } from '../../components/TodoEditor'
import { TodoList, buildTogglePatch } from '../../components/TodoList'
import { apiClient } from '../../lib/api/client'
import type { DashboardResponse, Todo, TodoInput } from '../../lib/api/types'
import { useSession } from '../../lib/session'

export function DashboardPage() {
  const { currentUser, logout } = useSession()
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null)
  const [todos, setTodos] = useState<Todo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)

  async function loadData() {
    setIsLoading(true)
    setError(null)

    try {
      const [dashboardResponse, todosResponse] = await Promise.all([
        apiClient.getDashboard(),
        apiClient.listTodos(),
      ])

      setDashboard(dashboardResponse)
      setTodos(todosResponse.items)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load dashboard.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  async function handleCreate(payload: TodoInput) {
    setIsSaving(true)
    setError(null)

    try {
      await apiClient.createTodo(payload)
      await loadData()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save todo.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleUpdate(payload: TodoInput) {
    if (!editingTodo) {
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      await apiClient.updateTodo(editingTodo.id, payload)
      setEditingTodo(null)
      await loadData()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to update todo.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(todoId: string) {
    setIsSaving(true)
    setError(null)

    try {
      await apiClient.deleteTodo(todoId)
      if (editingTodo?.id === todoId) {
        setEditingTodo(null)
      }
      await loadData()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete todo.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleToggle(todo: Todo) {
    setIsSaving(true)
    setError(null)

    try {
      await apiClient.updateTodo(todo.id, buildTogglePatch(todo))
      await loadData()
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : 'Failed to update todo status.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleLogout() {
    await logout()
  }

  return (
    <Shell>
      <main className="dashboard-layout">
        <header className="panel dashboard-header">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h1>{currentUser?.displayName ? `${currentUser.displayName}'s todo board` : 'Todo board'}</h1>
            <p>Monitor status, manage active tasks, and keep the backend contract visible from the UI.</p>
          </div>
          <button className="ghost-button" onClick={() => void handleLogout()} type="button">
            Sign out
          </button>
        </header>

        {error ? <p className="panel form-error global-error">{error}</p> : null}

        {isLoading ? (
          <section className="panel status-panel">
            <p className="eyebrow">Loading</p>
            <h2>Refreshing your tasks</h2>
          </section>
        ) : (
          <>
            <section className="summary-grid">
              <SummaryCard label="Total todos" tone="default" value={dashboard?.summary.totalTodos ?? 0} />
              <SummaryCard label="Active" tone="accent" value={dashboard?.summary.activeTodos ?? 0} />
              <SummaryCard label="Completed" tone="success" value={dashboard?.summary.completedTodos ?? 0} />
            </section>

            <section className="dashboard-grid">
              <div className="stack">
                <TodoEditor
                  key={editingTodo?.id ?? 'new'}
                  initialValue={editingTodo ?? undefined}
                  isSubmitting={isSaving}
                  onCancelEdit={() => setEditingTodo(null)}
                  onSubmit={(payload) => (editingTodo ? handleUpdate(payload) : handleCreate(payload))}
                />
                <section className="panel priority-panel">
                  <div className="section-heading">
                    <div>
                      <p className="eyebrow">Priority view</p>
                      <h2>Next tasks surfaced from the dashboard API</h2>
                    </div>
                  </div>
                  <ul className="priority-list">
                    {dashboard?.highPriorityTodos.length ? (
                      dashboard.highPriorityTodos.map((todo) => <li key={todo.id}>{todo.title}</li>)
                    ) : (
                      <li>No prioritized tasks yet.</li>
                    )}
                  </ul>
                </section>
              </div>

              <TodoList
                isSaving={isSaving}
                onDelete={handleDelete}
                onEdit={setEditingTodo}
                onToggle={handleToggle}
                todos={todos}
              />
            </section>
          </>
        )}
      </main>
    </Shell>
  )
}
