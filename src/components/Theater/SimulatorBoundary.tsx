'use client';

import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

export class SimulatorBoundary extends React.Component<Props, State> {
  public state: State = { error: null };

  public static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ScreenSimulator render error caught:', error, errorInfo);
  }

  public render() {
    if (this.state.error) {
      return (
        <div className="flex-1 w-full h-full min-h-[300px] flex flex-col items-center justify-center bg-surface-0 border border-white/5 rounded-2xl p-6 select-none shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
          <div className="text-rose-500/80 text-xs font-mono tracking-widest uppercase mb-2">
            [ SIMULATOR RENDER CRASHED ]
          </div>
          <div className="text-white/50 text-[0.6875rem] font-mono max-w-md text-center break-all">
            {this.state.error.message || 'Unknown rendering exception occurred'}
          </div>
          <button 
            onClick={() => this.setState({ error: null })}
            className="mt-4 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white rounded-lg text-[0.6875rem] font-mono tracking-wider transition-all duration-200"
          >
            RETRY RENDER
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
