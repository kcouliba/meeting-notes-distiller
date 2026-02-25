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
  language: 'en',
};

export const emptyReport: MeetingReport = {
  summary: [],
  decisions: [],
  actions: [],
  pending: [],
  participants: [],
  language: 'en',
};

export const minimalReport: MeetingReport = {
  summary: ['Quick sync on project status'],
  decisions: [],
  actions: [
    { title: 'Review PR', task: 'Review the PR', assignee: null, deadline: null },
  ],
  pending: [],
  participants: ['Alice'],
  language: 'en',
};

export const frenchReport: MeetingReport = {
  summary: [
    'Discussion de la feuille de route T1 et approbation des initiatives clés',
    'Adoption du nouveau pipeline CI/CD prévue pour fin février',
  ],
  decisions: [
    'Adopter le nouveau pipeline CI/CD d\'ici fin février',
    'Budget marketing approuvé à 50 000 €',
  ],
  actions: [
    { title: 'Préparer migration', task: 'Préparer le plan de migration', assignee: 'Bob', deadline: '30 jan.' },
    { title: 'Envoyer maquettes', task: 'Envoyer les maquettes au client', assignee: 'Charlie', deadline: '5 fév.' },
  ],
  pending: [
    'Besoin de recruter un prestataire pour le frontend ?',
  ],
  participants: ['Alice', 'Bob', 'Charlie'],
  language: 'fr',
};
