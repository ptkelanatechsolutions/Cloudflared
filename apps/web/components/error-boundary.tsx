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
        <main className="flex h-dvh flex-col items-center justify-center gap-6 px-6">
          <div className="text-center">
            <h1 className="font-heading text-6xl font-bold tracking-tighter text-foreground">
              Oops
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Something went wrong rendering this page.
            </p>
          </div>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reload page
          </Button>
        </main>
      );
    }

    return this.props.children;
  }
}
