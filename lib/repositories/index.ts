import { getDb } from '@/lib/db';
import { MeetingsRepository } from './meetings.repository';
import { TasksRepository } from './tasks.repository';

export interface Repositories {
  meetings: MeetingsRepository;
  tasks: TasksRepository;
}

let repos: Repositories | null = null;

export function getRepositories(): Repositories {
  if (!repos) {
    const db = getDb();
    repos = {
      meetings: new MeetingsRepository(db),
      tasks: new TasksRepository(db),
    };
  }
  return repos;
}
