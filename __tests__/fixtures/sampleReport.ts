import { MeetingReport } from '@/types/meeting';

export const fullReport: MeetingReport = {
  summary: [
    'Discussed Q1 roadmap and approved key initiatives',
    'New CI/CD pipeline adoption planned for end of February',
    'Marketing budget approved at $50k',
  ],
  decisions: [
    'Adopt the new CI/CD pipeline by end of February',
    'Marketing budget approved at $50k',
  ],
  actions: [
    { title: 'Prepare migration', task: 'Prepare the migration plan', assignee: 'Bob', deadline: 'Jan 30' },
    { title: 'Send designs', task: 'Send updated designs to client', assignee: 'Charlie', deadline: 'Feb 5' },
    { title: 'Schedule follow-up', task: 'Schedule follow-up with VP', assignee: 'Alice', deadline: null },
  ],
  pending: [
    'Need to hire a contractor for frontend work?',
    'Timeline for security audit unclear',
  ],
  participants: ['Alice', 'Bob', 'Charlie'],
};

export const emptyReport: MeetingReport = {
  summary: [],
  decisions: [],
  actions: [],
  pending: [],
  participants: [],
};

export const minimalReport: MeetingReport = {
  summary: ['Quick sync on project status'],
  decisions: [],
  actions: [
    { title: 'Review PR', task: 'Review the PR', assignee: null, deadline: null },
  ],
  pending: [],
  participants: ['Alice'],
};
