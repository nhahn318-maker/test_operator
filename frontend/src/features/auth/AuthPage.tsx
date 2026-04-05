import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Shell } from '../../components/Shell'
import { useSession } from '../../lib/session'

type AuthPageProps = {
  mode: 'login' | 'register'
}

export function AuthPage({ mode }: AuthPageProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, register } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const nextPath = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.')
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      if (mode === 'login') {
        await login({ email: email.trim(), password })
      } else {
        await register({
          email: email.trim(),
          password,
          displayName: displayName.trim() || undefined,
        })
      }

      navigate(nextPath, { replace: true })
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Unable to complete this request.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isRegister = mode === 'register'

  return (
    <Shell>
      <main className="auth-layout">
        <section className="hero-card">
          <div>
            <p className="eyebrow">Todo control center</p>
            <h1>Track what matters without losing the signal.</h1>
            <p>
              Secure sign-in, fast task capture, and a dashboard that keeps active work visible.
            </p>
          </div>

          <div className="hero-metrics" aria-hidden="true">
            <span>Auth</span>
            <span>Dashboard</span>
            <span>API-first</span>
            <span>Tests</span>
          </div>
        </section>

        <section className="panel auth-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{isRegister ? 'Create account' : 'Welcome back'}</p>
              <h2>{isRegister ? 'Start your workspace' : 'Sign in to continue'}</h2>
            </div>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {isRegister ? (
              <label className="field">
                <span>Display name</span>
                <input
                  name="displayName"
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Alex Doe"
                  value={displayName}
                />
              </label>
            ) : null}

            <label className="field">
              <span>Email</span>
              <input
                autoComplete="email"
                name="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="user@example.com"
                type="email"
                value={email}
              />
            </label>

            <label className="field">
              <span>Password</span>
              <input
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                name="password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                type="password"
                value={password}
              />
            </label>

            {error ? <p className="form-error">{error}</p> : null}

            <button className="primary-button" disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Working...' : isRegister ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <p className="auth-switch">
            {isRegister ? 'Already have an account?' : 'Need an account?'}{' '}
            <Link to={isRegister ? '/login' : '/register'}>
              {isRegister ? 'Sign in' : 'Create one'}
            </Link>
          </p>
        </section>
      </main>
    </Shell>
  )
}
