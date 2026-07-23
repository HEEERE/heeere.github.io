import {describe, expect, it, vi} from 'vitest';
import type {SceneController} from './types';
import {StateMachine} from './StateMachine';

const scene = (label: string, trace: string[]): SceneController => ({
  enter: vi.fn(async () => { trace.push(`${label}:enter`); }),
  exit: vi.fn(async () => { trace.push(`${label}:exit`); }),
  update: vi.fn(),
  resize: vi.fn(),
  dispose: vi.fn(),
});

describe('StateMachine', () => {
  it('exits the previous scene before entering the next scene', async () => {
    const trace: string[] = [];
    const machine = new StateMachine();
    machine.register('intro', scene('intro', trace));
    machine.register('hub', scene('hub', trace));

    await machine.transition('intro');
    await machine.transition('hub');

    expect(machine.state).toBe('hub');
    expect(trace).toEqual(['intro:enter', 'intro:exit', 'hub:enter']);
  });

  it('rejects overlapping transitions and releases its lock afterwards', async () => {
    let release: (() => void) | undefined;
    const waiting: SceneController = {
      enter: () => new Promise<void>((resolve) => { release = resolve; }),
      exit: async () => undefined,
      update: () => undefined,
      resize: () => undefined,
      dispose: () => undefined,
    };
    const machine = new StateMachine();
    machine.register('intro', waiting);

    const first = machine.transition('intro');
    expect(machine.isTransitioning).toBe(true);
    await expect(machine.transition('hub')).resolves.toBe(false);
    release?.();
    await expect(first).resolves.toBe(true);
    expect(machine.isTransitioning).toBe(false);
  });
});
