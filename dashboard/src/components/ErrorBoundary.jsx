import { Component } from 'react';

/**
 * Error boundary for catching render errors
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-void flex items-center justify-center p-6">
          <div className="card card-glow-critical max-w-lg text-center">
            <h1 className="text-2xl font-bold text-critical mb-4">
              ⚠️ Something went wrong
            </h1>
            <p className="text-zinc-400 mb-4">
              The dashboard encountered an unexpected error.
            </p>
            {this.state.error && (
              <details className="text-left mb-4">
                <summary className="text-sm text-zinc-500 cursor-pointer hover:text-zinc-400 mb-2">
                  Error details
                </summary>
                <pre className="text-xs bg-zinc-900 p-3 rounded-lg overflow-auto max-h-40 text-zinc-500">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack && (
                    <div className="mt-2 pt-2 border-t border-zinc-800">
                      {this.state.errorInfo.componentStack}
                    </div>
                  )}
                </pre>
              </details>
            )}
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null, errorInfo: null });
                window.location.reload();
              }}
              className="px-4 py-2 bg-neon-green/20 text-neon-green border border-neon-green/30 rounded-lg hover:bg-neon-green/30 transition-all"
            >
              Reload Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
