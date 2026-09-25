import { Component, type ReactNode } from "react";

/**
 * Keeps a WebGL failure (no context, lost driver, a chunk that won't load)
 * from taking the page down with it: the scene renders nothing and the
 * poster underneath stays the hero.
 */
export default class SceneBoundary extends Component<
  { children: ReactNode; onFail?: () => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    this.props.onFail?.();
    if (import.meta.env.DEV) console.warn("[hero] 3D hall unavailable, showing the poster.", error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
