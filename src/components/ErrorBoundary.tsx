import React from "react";

interface State {
  hasError: boolean;
  error?: Error | null;
}

interface Props {
  children?: React.ReactNode;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-card p-6 rounded-lg border border-border max-w-md text-center">
            <h3 className="text-lg font-bold mb-2">Something went wrong</h3>
            <p className="text-sm text-muted-foreground mb-4">A UI component failed to load. Try closing this and continuing.</p>
            <button onClick={() => this.setState({ hasError: false, error: null })} className="px-4 py-2 bg-primary text-primary-foreground rounded">Close</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
