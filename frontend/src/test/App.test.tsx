import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../app/App'
import { resetMockState } from './server'

describe('App', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/dashboard')
  })

  it('redirects unauthenticated users to login', async () => {
    resetMockState({ authenticated: false })

    render(<App />)

    expect(await screen.findByRole('heading', { name: /sign in to continue/i })).toBeInTheDocument()
  })

  it('renders dashboard metrics and todo data for authenticated users', async () => {
    resetMockState({
      authenticated: true,
      initialTodos: [
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
        {
          id: 'todo-2',
          title: 'Review dashboard cards',
          description: 'Validate metric rendering.',
          status: 'completed',
          dueDate: null,
          completedAt: '2026-04-05T11:00:00Z',
          createdAt: '2026-04-05T10:35:00Z',
          updatedAt: '2026-04-05T11:00:00Z',
        },
      ],
    })

    render(<App />)

    expect(await screen.findByRole('button', { name: /create todo/i })).toBeInTheDocument()
    expect(screen.getByText('Total todos')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Review dashboard cards' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Finish architecture draft' })).toBeInTheDocument()
  })

  it('creates and updates a todo from the dashboard flow', async () => {
    resetMockState({ authenticated: true })
    const user = userEvent.setup()

    render(<App />)

    await screen.findByRole('button', { name: /create todo/i })

    await user.type(screen.getByLabelText(/title/i), 'Ship frontend implementation')
    await user.type(screen.getByLabelText(/description/i), 'Wire auth, dashboard, and todo flows.')
    await user.click(screen.getByRole('button', { name: /create todo/i }))

    expect(
      await screen.findByRole('heading', { level: 3, name: 'Ship frontend implementation' }),
    ).toBeInTheDocument()

    const completeButtons = screen.getAllByRole('button', { name: /complete/i })
    await user.click(completeButtons[0])

    await waitFor(() => {
      expect(screen.getByText('completed')).toBeInTheDocument()
    })
  })
})
