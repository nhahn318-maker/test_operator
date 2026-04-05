import type { PropsWithChildren } from 'react'

export function Shell({ children }: PropsWithChildren) {
  return (
    <div className="app-shell">
      <div aria-hidden="true" className="glow glow-one" />
      <div aria-hidden="true" className="glow glow-two" />
      {children}
    </div>
  )
}
