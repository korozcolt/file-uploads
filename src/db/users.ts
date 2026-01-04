import { deleteAllUsersRecord, getUserByUsernameRecord, insertUserRecord } from './index';

import { v4 as uuidv4 } from 'uuid';

export function createUser({ username, passwordHash, role }: { username: string; passwordHash: string; role?: string }) {
  const id = uuidv4();
  const now = new Date().toISOString();
  return insertUserRecord({ id, username, password_hash: passwordHash, role: role || 'admin', created_at: now });
}

export function getUserByUsername(username: string) {
  return getUserByUsernameRecord(username);
}

export function deleteAllUsers() {
  return deleteAllUsersRecord();
}
