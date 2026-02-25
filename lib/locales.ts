export interface LocaleStrings {
  meetingReport: string;
  summary: string;
  decisions: string;
  actionItems: string;
  pendingItems: string;
  participants: string;
  keyPoints: string;
  needsFollowup: string;
  emailSubject: string;
  emailGreeting: string;
  emailIntro: string;
  emailSignoff: string;
  assignedTo: string;
  deadline: string;
  by: string;
  due: string;
}

const en: LocaleStrings = {
  meetingReport: 'Meeting Report',
  summary: 'Summary',
  decisions: 'Decisions',
  actionItems: 'Action Items',
  pendingItems: 'Pending Items',
  participants: 'Participants',
  keyPoints: 'Key Points',
  needsFollowup: 'Needs Follow-up',
  emailSubject: 'Meeting Report',
  emailGreeting: 'Hello,',
  emailIntro: 'Please find below the summary of our meeting.',
  emailSignoff: 'Best regards',
  assignedTo: 'Assigned to',
  deadline: 'Deadline',
  by: 'by',
  due: 'Due',
};

const fr: LocaleStrings = {
  meetingReport: 'Compte rendu de réunion',
  summary: 'Résumé',
  decisions: 'Décisions',
  actionItems: 'Actions à mener',
  pendingItems: 'Points en suspens',
  participants: 'Participants',
  keyPoints: 'Points clés',
  needsFollowup: 'Suivi nécessaire',
  emailSubject: 'Compte rendu de réunion',
  emailGreeting: 'Bonjour,',
  emailIntro: 'Veuillez trouver ci-dessous le résumé de notre réunion.',
  emailSignoff: 'Cordialement',
  assignedTo: 'Assigné à',
  deadline: 'Échéance',
  by: 'pour le',
  due: 'Échéance',
};

const locales: Record<string, LocaleStrings> = { en, fr };

export function getLocale(language: string): LocaleStrings {
  return locales[language] ?? locales.en;
}
