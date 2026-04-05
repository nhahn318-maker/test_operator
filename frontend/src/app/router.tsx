import { Navigate, Outlet, createBrowserRouter, useLocation } from 'react-router-dom'
import { Shell } from '../components/Shell'
import { AuthPage } from '../features/auth/AuthPage'
import { DashboardPage } from '../features/dashboard/DashboardPage'
import { useSession } from '../lib/session'

function AuthenticatedLayout() {
  const location = useLocation()
  const { isAuthenticated, isLoading } = useSession()

  if (isLoading) {
    return (
      <Shell>
        <div className="panel status-panel">
          <p className="eyebrow">Session</p>
          <h1>Checking your workspace</h1>
          <p>Restoring your session and loading the latest task view.</p>
        </div>
      </Shell>
    )
  }

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location.pathname }} to="/login" />
  }

  return <Outlet />
}

function AuthOnlyLayout() {
  const { isAuthenticated, isLoading } = useSession()

  if (isLoading) {
    return (
      <Shell>
        <div className="panel status-panel">
          <p className="eyebrow">Session</p>
          <h1>Preparing your workspace</h1>
        </div>
      </Shell>
    )
  }

  if (isAuthenticated) {
    return <Navigate replace to="/dashboard" />
  }

  return <Outlet />
}

export const router = createBrowserRouter([
  {
    element: <AuthOnlyLayout />,
    children: [
      { path: '/', element: <Navigate replace to="/dashboard" /> },
      { path: '/login', element: <AuthPage mode="login" /> },
      { path: '/register', element: <AuthPage mode="register" /> },
    ],
  },
  {
    element: <AuthenticatedLayout />,
    children: [{ path: '/dashboard', element: <DashboardPage /> }],
  },
])
