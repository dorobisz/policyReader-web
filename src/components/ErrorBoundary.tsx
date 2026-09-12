import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Opcjonalny niestandardowy widok błędu. */
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
  /** Opcjonalny callback przy wychwyceniu błędu. */
  onError?: (error: Error, info: React.ErrorInfo) => void;
}

/**
 * ErrorBoundary — wychwytuje błędy renderowania React w poddrzewie.
 *
 * Użycie:
 *   <ErrorBoundary>
 *     <MojWidok />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error("[ErrorBoundary] Uncaught error:", error, info);
    this.props.onError?.(error, info);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }
      return (
        <div className="flex flex-col items-center justify-center min-h-[40vh] p-xl text-center">
          <span className="material-symbols-outlined text-error text-5xl mb-md block">error_outline</span>
          <h2 className="font-headline-sm text-headline-sm text-on-surface mb-sm">
            Something went wrong
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-lg max-w-md">
            {this.state.error.message || "An unexpected error occurred. Please try again."}
          </p>
          <button
            onClick={this.reset}
            className="flex items-center gap-xs px-md py-sm rounded-lg bg-secondary text-on-secondary font-label-bold text-label-bold hover:bg-secondary/90 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;