'use client';

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// ============================================================================
// TYPES
// ============================================================================

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showDetails?: boolean;
  resetOnNavigate?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

// ============================================================================
// ERROR BOUNDARY COMPONENT
// ============================================================================

/**
 * Error Boundary Component
 *
 * Catches JavaScript errors in child components and displays a fallback UI.
 * Logs errors for debugging and provides recovery options.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ errorInfo });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught error:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // In production, could send to error tracking service
    // e.g., Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, showDetails = false } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="max-w-lg w-full shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-xl">Something went wrong</CardTitle>
              <CardDescription>
                An unexpected error occurred. Our team has been notified.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {showDetails && error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                  <p className="text-sm font-medium text-red-800 mb-2">Error Details:</p>
                  <code className="text-xs text-red-700 block whitespace-pre-wrap break-all">
                    {error.message}
                  </code>
                  {process.env.NODE_ENV === 'development' && errorInfo && (
                    <details className="mt-3">
                      <summary className="text-xs text-red-600 cursor-pointer hover:text-red-800">
                        Component Stack
                      </summary>
                      <pre className="mt-2 text-xs text-red-600 overflow-auto max-h-40">
                        {errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="text-center text-sm text-muted-foreground">
                <p>You can try the following:</p>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={this.handleReset}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={this.handleReload}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reload Page
              </Button>
              <Button
                variant="default"
                className="flex-1 bg-circleTel-orange hover:bg-circleTel-orange/90"
                onClick={this.handleGoHome}
              >
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return children;
  }
}

// ============================================================================
// SPECIALIZED ERROR BOUNDARIES
// ============================================================================

interface SectionErrorBoundaryProps {
  children: ReactNode;
  sectionName?: string;
  onError?: (error: Error) => void;
}

/**
 * Section Error Boundary
 *
 * Lightweight error boundary for individual page sections.
 * Shows a compact error message without disrupting the entire page.
 */
export class SectionErrorBoundary extends Component<
  SectionErrorBoundaryProps,
  { hasError: boolean; error: Error | null }
> {
  constructor(props: SectionErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">
                {this.props.sectionName
                  ? `Failed to load ${this.props.sectionName}`
                  : 'This section encountered an error'}
              </p>
              <p className="text-xs text-red-600 mt-1">
                Try refreshing the page or contact support if the problem persists.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to report errors to an error tracking service
 */
export function useErrorReporter() {
  return {
    reportError: (error: Error, context?: Record<string, unknown>) => {
      // In production, send to error tracking service
      if (process.env.NODE_ENV === 'production') {
        // Sentry.captureException(error, { extra: context });
        console.error('[ErrorReporter]', { error: error.message, context });
      } else {
        console.error('[ErrorReporter]', error, context);
      }
    },
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ErrorBoundary;
