import {Component, type ErrorInfo, type ReactNode} from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    errorMessage: '',
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let message = error.message || 'An unexpected error occurred.';
    try {
      const parsed = JSON.parse(message) as {error?: string; operationType?: string; path?: string};
      if (parsed && parsed.error) {
        message = parsed.path
          ? `${parsed.error} (${parsed.operationType || 'operation'} on ${parsed.path})`
          : parsed.error;
      }
    } catch {
      // plain text error
    }
    return {
      hasError: true,
      errorMessage: message,
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application ErrorBoundary caught:', error, info);
  }

  handleReload = () => {
    this.setState({hasError: false, errorMessage: ''});
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#08090D] px-6 text-center text-[#F5F5F7]">
          <div className="max-w-md rounded-2xl border border-white/[0.08] bg-[#11131B] p-8 shadow-2xl">
            <h1 className="font-display text-xl font-bold text-[#F5F5F7]">
              Something went wrong
            </h1>
            <p className="mt-3 text-sm text-[#9CA3AF] leading-relaxed">
              {this.state.errorMessage}
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-95"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
