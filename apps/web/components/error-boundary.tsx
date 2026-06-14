"use client";

import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex h-dvh flex-col items-center justify-center gap-8 px-6">
          <div className="text-center">
            <h1 className="font-heading text-6xl font-bold tracking-tighter text-foreground">
              Oops
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Something went wrong rendering this page.
            </p>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-4 max-w-md text-left">
                <summary className="cursor-pointer text-xs text-muted-foreground">
                  Error details
                </summary>
                <pre className="mt-2 overflow-auto rounded-lg bg-muted p-3 text-xs text-destructive">
                  {this.state.error.message}
                  {"\n"}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Reload page
            </Button>
            <Button
              variant="secondary"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Try again
            </Button>
          </div>
          <a
            href="https://github.com/ptkelanatechsolutions/Cloudflared/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
          >
            Report this issue on GitHub
          </a>
        </main>
      );
    }

    return this.props.children;
  }
}
