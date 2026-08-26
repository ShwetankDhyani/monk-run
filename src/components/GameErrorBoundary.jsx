import { Component } from 'react'

/**
 * Catches render errors in a game phase so one bad mount does not white-screen
 * the whole client (WebRTC/audio can keep running otherwise).
 */
export class GameErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[monk.run] UI error boundary', error, info?.componentStack)
  }

  render() {
    if (this.state.error) {
      const label = this.props.label || 'Something went wrong'
      const onRetry = this.props.onRetry
      return (
        <div className="relative z-10 grid min-h-[40vh] place-items-center p-6 text-center">
          <div className="max-w-sm">
            <p className="font-display text-xl text-brass-bright">{label}</p>
            <p className="mt-2 text-sm text-muted">The view hit a snag. You can retry without leaving the room.</p>
            {onRetry ? (
              <button type="button" className="btn btn-primary mt-5 w-full" onClick={() => {
                this.setState({ error: null })
                onRetry()
              }}>
                Retry
              </button>
            ) : (
              <button type="button" className="btn btn-ghost mt-5" onClick={() => this.setState({ error: null })}>
                Dismiss
              </button>
            )}
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
