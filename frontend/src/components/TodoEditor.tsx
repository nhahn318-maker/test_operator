import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Todo, TodoInput } from '../lib/api/types'

type TodoEditorProps = {
  initialValue?: Todo
  isSubmitting: boolean
  onSubmit: (payload: TodoInput) => Promise<void>
  onCancelEdit?: () => void
}

function toDateInputValue(value: string | null) {
  return value ? value.slice(0, 10) : ''
}

export function TodoEditor({ initialValue, isSubmitting, onSubmit, onCancelEdit }: TodoEditorProps) {
  const [title, setTitle] = useState(initialValue?.title ?? '')
  const [description, setDescription] = useState(initialValue?.description ?? '')
  const [dueDate, setDueDate] = useState(toDateInputValue(initialValue?.dueDate ?? null))
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!title.trim()) {
      setError('Title is required.')
      return
    }

    setError(null)
    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate: dueDate ? new Date(`${dueDate}T00:00:00.000Z`).toISOString() : null,
    })

    if (!initialValue) {
      setTitle('')
      setDescription('')
      setDueDate('')
    }
  }

  return (
    <form className="panel todo-editor" onSubmit={handleSubmit}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">{initialValue ? 'Update todo' : 'New todo'}</p>
          <h2>{initialValue ? 'Refine the task details' : 'Capture the next task fast'}</h2>
        </div>
      </div>

      <label className="field">
        <span>Title</span>
        <input
          name="title"
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Ship frontend skeleton"
          value={title}
        />
      </label>

      <label className="field">
        <span>Description</span>
        <textarea
          name="description"
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Optional details, notes, or acceptance criteria."
          rows={4}
          value={description}
        />
      </label>

      <label className="field">
        <span>Due date</span>
        <input name="dueDate" onChange={(event) => setDueDate(event.target.value)} type="date" value={dueDate} />
      </label>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="actions">
        <button className="primary-button" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Saving...' : initialValue ? 'Save changes' : 'Create todo'}
        </button>
        {initialValue && onCancelEdit ? (
          <button className="ghost-button" disabled={isSubmitting} onClick={onCancelEdit} type="button">
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  )
}
