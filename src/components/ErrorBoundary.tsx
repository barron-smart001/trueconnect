import { Component, type ErrorInfo, type ReactNode } from 'react'

type State = { failed: boolean }

/** Last line of defence: show a recoverable message instead of a blank screen when rendering throws. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled render error', error, info.componentStack)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-cream px-6 text-center">
        <h1 className="font-serif text-[32px] leading-10 text-ink">Something went wrong</h1>
        <p className="mt-3 max-w-[420px] text-[16px] leading-6 text-[#5c5748]">
          An unexpected error stopped this page from loading. Reloading usually fixes it.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-8 flex h-[38px] items-center rounded-md bg-gold px-4 text-[14px] font-medium text-ink"
        >
          Reload the page
        </button>
      </main>
    )
  }
}
