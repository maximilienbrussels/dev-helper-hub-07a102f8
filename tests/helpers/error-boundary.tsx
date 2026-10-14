import { Component as ReactComponent, type ReactNode } from "react";

type Props = { children: ReactNode; fallback: (error: Error) => ReactNode };
type State = { error: Error | null };

/** Minimale error boundary om routecrashes in tests te forceren. */
export class Component extends ReactComponent<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override render() {
    if (this.state.error) return this.props.fallback(this.state.error);
    return this.props.children;
  }
}
