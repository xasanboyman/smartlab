import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return typeof this.props.fallback === "function"
          ? this.props.fallback({ error: this.state.error, reset: this.resetError })
          : this.props.fallback;
      }
      return (
        <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-white/80">
          <p className="mb-2 text-sm font-semibold text-rose-400">3D sahnada xatolik yuz berdi</p>
          <p className="mb-4 max-w-md text-xs text-white/50">{this.state.error?.message || "Noma'lum xatolik"}</p>
          <button
            type="button"
            onClick={this.resetError}
            className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-white transition hover:bg-white/20 cursor-pointer"
          >
            Qayta yuklash
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
