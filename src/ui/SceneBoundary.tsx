import {Component, type ErrorInfo, type ReactNode} from 'react';

type Props = {
  fallback: ReactNode;
  children: ReactNode;
  label?: string;
};

type State = {failed: boolean};

/**
 * Keeps a single broken diorama from taking down the whole page. Each canvas is
 * isolated so the static artwork can step in instead.
 */
export class SceneBoundary extends Component<Props, State> {
  public override state: State = {failed: false};

  public static getDerivedStateFromError(): State {
    return {failed: true};
  }

  public override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.warn(`[scene] ${this.props.label ?? 'scene'} failed to render`, error, info.componentStack);
  }

  public override render(): ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
