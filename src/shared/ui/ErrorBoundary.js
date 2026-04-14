import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="m-6 rounded-xl border border-red-400/30 bg-red-500/10 p-6 text-red-200">
          <p className="text-lg font-semibold">System fault detected</p>
          <p className="mt-1 text-sm text-red-200/80">
            An unexpected error occurred. You can reload the page to recover.
          </p>
          <button
            type="button"
            className="mt-4 rounded-md border border-red-400/40 bg-red-950/50 px-4 py-2 text-sm font-medium text-red-100 hover:bg-red-950/80"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
