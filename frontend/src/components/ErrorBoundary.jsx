import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // You can also log to an error reporting service here
    // Example: logErrorToService(error, errorInfo);

    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
  }

  handleReset = () => {
    // Reset error boundary state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Reload the page to reset the app state
    window.location.href = "/";
  };

  handleReload = () => {
    // Simply reload the current page
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Render fallback UI when an error occurs
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-4">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12 border-2 border-red-200">
            {/* Error Icon */}
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-full shadow-lg">
                <AlertTriangle className="h-16 w-16 text-white" />
              </div>
            </div>

            {/* Error Title */}
            <h1 className="text-4xl font-bold text-center text-gray-900 mb-4">
              Oops! Something went wrong
            </h1>

            {/* Error Description */}
            <p className="text-lg text-gray-600 text-center mb-8">
              We're sorry for the inconvenience. An unexpected error has
              occurred in the application.
            </p>

            {/* Error Details (Development Mode) */}
            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="mb-8 p-6 bg-red-50 border-2 border-red-200 rounded-xl">
                <h3 className="text-lg font-bold text-red-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Error Details (Dev Mode):
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-red-800 mb-1">
                      Error Message:
                    </p>
                    <p className="text-sm text-red-700 font-mono bg-red-100 p-2 rounded">
                      {this.state.error.toString()}
                    </p>
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <p className="text-sm font-semibold text-red-800 mb-1">
                        Component Stack:
                      </p>
                      <pre className="text-xs text-red-700 bg-red-100 p-3 rounded overflow-x-auto">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-xl font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Home className="h-5 w-5" />
                Go to Home
              </button>
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-gray-50 text-gray-800 rounded-xl font-bold text-lg border-2 border-gray-300 hover:border-gray-400 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <RefreshCw className="h-5 w-5" />
                Reload Page
              </button>
            </div>

            {/* Help Text */}
            <p className="text-center text-sm text-gray-500 mt-8">
              If this problem persists, please contact our support team at{" "}
              <a
                href="mailto:support@homehero.com"
                className="text-cyan-600 hover:text-cyan-700 font-semibold underline"
              >
                support@homehero.com
              </a>
            </p>
          </div>
        </div>
      );
    }

    // No error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;
