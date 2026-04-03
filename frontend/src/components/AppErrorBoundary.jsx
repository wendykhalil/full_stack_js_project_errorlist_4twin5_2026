import React from "react";

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || "Unexpected application error",
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("AppErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 dark:bg-slate-950">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Something went wrong</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              The app hit a runtime error. Refresh the page. If it keeps happening, this message helps identify the failing component.
            </p>
            <pre className="mt-4 overflow-auto rounded-xl bg-slate-100 p-3 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {this.state.message}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
