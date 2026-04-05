import type { Todo, TodoPatch } from '../lib/api/types'
import { formatDateLabel } from '../lib/date'

type TodoListProps = {
  todos: Todo[]
  isSaving: boolean
  onEdit: (todo: Todo) => void
  onDelete: (todoId: string) => Promise<void>
  onToggle: (todo: Todo) => Promise<void>
}

export function TodoList({ todos, isSaving, onEdit, onDelete, onToggle }: TodoListProps) {
  if (!todos.length) {
    return (
      <section className="panel empty-state">
        <p className="eyebrow">Todo list</p>
        <h2>No tasks yet</h2>
        <p>Create your first task to populate the dashboard and start tracking progress.</p>
      </section>
    )
  }

  return (
    <section className="panel todo-list-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Todo list</p>
          <h2>Everything in one queue</h2>
        </div>
      </div>

      <ul className="todo-list">
        {todos.map((todo) => (
          <li className={`todo-item ${todo.status === 'completed' ? 'is-complete' : ''}`} key={todo.id}>
            <div className="todo-main">
              <div>
                <h3>{todo.title}</h3>
                {todo.description ? <p>{todo.description}</p> : null}
              </div>
              <span className={`status-pill status-${todo.status}`}>{todo.status}</span>
            </div>

            <div className="todo-meta">
              <span>Updated {formatDateLabel(todo.updatedAt)}</span>
              <span>{todo.dueDate ? `Due ${formatDateLabel(todo.dueDate)}` : 'No due date'}</span>
            </div>

            <div className="actions">
              <button className="ghost-button" disabled={isSaving} onClick={() => onToggle(todo)} type="button">
                {todo.status === 'completed' ? 'Reopen' : 'Complete'}
              </button>
              <button className="ghost-button" disabled={isSaving} onClick={() => onEdit(todo)} type="button">
                Edit
              </button>
              <button className="danger-button" disabled={isSaving} onClick={() => onDelete(todo.id)} type="button">
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function buildTogglePatch(todo: Todo): TodoPatch {
  return {
    status: todo.status === 'completed' ? 'active' : 'completed',
  }
}
