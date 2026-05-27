import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an exception:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleHardReset = async () => {
    try {
      // Clear localStorage and sessionStorage
      localStorage.clear();
      sessionStorage.clear();

      // Clear all caches in the Cache Storage API
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          await caches.delete(cacheName);
        }
      }

      // Unregister all service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }

      // Hard reload bypassing cache
      window.location.href = window.location.origin + '?nocache=' + Date.now();
    } catch (err) {
      console.error("Hard reset failed:", err);
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#fdfcfb] flex flex-col items-center justify-center p-6 text-stone-900 font-sans">
          <div className="max-w-md w-full bg-white rounded-[2.5rem] border border-stone-100 p-8 shadow-2xl space-y-6 relative overflow-hidden">
            {/* Background Pastel Spot */}
            <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-orange-100/40 blur-[80px] rounded-full pointer-events-none" />

            <div className="flex flex-col items-center text-center space-y-4 relative z-10">
              <div className="w-16 h-16 bg-orange-100/50 rounded-2xl flex items-center justify-center text-orange-600 font-bold text-2xl shadow-inner">
                ⚠
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
              <p className="text-sm text-stone-500 font-medium">
                Nemu encountered a runtime exception during startup or render. 
              </p>
            </div>

            {/* Error Message Details */}
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100/85 relative z-10 max-h-48 overflow-y-auto">
              <p className="text-xs font-mono font-semibold text-orange-600 mb-1">
                {this.state.error?.name || 'Error'}: {this.state.error?.message}
              </p>
              {this.state.errorInfo && (
                <pre className="text-[10px] font-mono text-stone-400 leading-normal whitespace-pre-wrap">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 relative z-10 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full h-12 bg-stone-900 text-white rounded-2xl font-semibold hover:bg-stone-850 active:scale-98 transition-all shadow-md"
              >
                Try Reloading
              </button>
              
              <button
                onClick={this.handleHardReset}
                className="w-full h-12 bg-stone-50 text-stone-600 border border-stone-100 rounded-2xl font-semibold hover:bg-stone-100 hover:text-stone-900 active:scale-98 transition-all text-xs"
              >
                Clear App Cache & Reset
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
