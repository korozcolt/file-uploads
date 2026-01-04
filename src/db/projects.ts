import {
  deleteProjectRecord,
  getProjectByIdRecord,
  getProjectBySlugRecord,
  insertProjectRecord,
  listProjectsRecord
} from './index';

import { v4 as uuidv4 } from 'uuid';

export function createProject({ name, slug, description }: { name: string; slug?: string; description?: string }) {
  const id = uuidv4();
  const s = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const now = new Date().toISOString();
  return insertProjectRecord({ id, name, slug: s, description, created_at: now, status: 'active' });
}

export function getProjectBySlug(slug: string) {
  return getProjectBySlugRecord(slug);
}

export function getProjectById(id: string) {
  return getProjectByIdRecord(id);
}

export function listProjects() {
  return listProjectsRecord();
}

export function deleteProject(id: string) {
  return deleteProjectRecord(id);
}
