import {describe, expect, it} from 'vitest';
import page from '../../index.html?raw';
import {profile} from './profile';
import {getProject, projects} from './projects';

const plainPage = page.replace(/<[^>]+>/g, '');

describe('project data', () => {
  it('keeps three distinct project nodes', () => {
    expect(projects).toHaveLength(3);
    expect(new Set(projects.map((project) => project.id)).size).toBe(3);
  });

  it('keeps every project readable without WebGL', () => {
    for (const project of projects) {
      expect(project.description.length).toBeGreaterThan(40);
      expect(project.contributions.length).toBeGreaterThanOrEqual(3);
      expect(project.stack.length).toBeGreaterThanOrEqual(5);
      expect(getProject(project.id)).toBe(project);
    }
  });

  it('keeps the complete resume available without WebGL', () => {
    expect(profile.courses).toHaveLength(7);
    expect(profile.professionalSkills).toHaveLength(8);
    expect(page).toContain(profile.email);
    expect(page).toContain(profile.github);
    expect(page).not.toMatch(/href=["']tel:|["']telephone["']\s*:/);
    expect(page).not.toMatch(/portrait\.png|个人照片/);
    expect(plainPage).toContain(profile.personalSummary);
    for (const course of profile.courses) expect(plainPage).toContain(course);
    for (const skill of profile.professionalSkills) expect(plainPage).toContain(skill);
    for (const project of projects) {
      expect(plainPage).toContain(project.title);
      expect(plainPage).toContain(project.description);
      for (const item of project.contributions) {
        expect(plainPage).toContain(item);
      }
    }
  });
});
