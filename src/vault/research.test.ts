import {describe, expect, it} from 'vitest';
import {researchEntry, researchStats} from './lib/research';

describe('research garden', () => {
  it('creates independent editable templates without saving sample records', () => {
    const a = researchEntry('paper');
    const b = researchEntry('paper');
    a.tags.push('private');
    expect(b.tags).toEqual(['论文']);
    expect(a.id).not.toBe(b.id);
    expect(a.body).toContain('实验与证据');
    expect(a.kind).toBe('tech');
  });
  it('counts calendar days and excludes trash and old records from weekly total', () => {
    const now = new Date(2026, 9, 23, 12).getTime();
    const today = researchEntry('review', now);
    const old = researchEntry('paper', new Date(2026, 9, 15, 12).getTime());
    const deleted = {...researchEntry('prompt', now), deletedAt: now};
    const firstDay = researchEntry('experiment', new Date(2026, 9, 17, 0).getTime());
    const stats = researchStats([today, old, deleted, firstDay], now);
    expect(stats.total).toBe(3);
    expect(stats.week).toBe(2);
    expect(stats.days).toHaveLength(7);
    expect(stats.days[0]?.count).toBe(1);
    expect(today.title).toContain('2026-10-23');
  });
});
