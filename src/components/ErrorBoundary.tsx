import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  name: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Telemetry-ready logging
    console.error(`[ErrorBoundary: ${this.props.name}] Caught error:`, {
      error,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 m-4 bg-red-50 border border-red-200 rounded-xl flex flex-col items-center justify-center text-center" role="alert" aria-live="assertive">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" aria-hidden="true" />
          <h2 className="text-lg font-bold text-red-900 mb-2">Something went wrong in {this.props.name}</h2>
          <p className="text-sm text-red-700 max-w-md mb-4">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
