import { getLocale } from '@/lib/locales';

describe('getLocale', () => {
  it('returns English locale for "en"', () => {
    const locale = getLocale('en');

    expect(locale.meetingReport).toBe('Meeting Report');
    expect(locale.summary).toBe('Summary');
    expect(locale.decisions).toBe('Decisions');
    expect(locale.actionItems).toBe('Action Items');
    expect(locale.pendingItems).toBe('Pending Items');
    expect(locale.participants).toBe('Participants');
    expect(locale.emailGreeting).toBe('Hello,');
    expect(locale.emailSignoff).toBe('Best regards');
  });

  it('returns French locale for "fr"', () => {
    const locale = getLocale('fr');

    expect(locale.meetingReport).toBe('Compte rendu de réunion');
    expect(locale.summary).toBe('Résumé');
    expect(locale.decisions).toBe('Décisions');
    expect(locale.actionItems).toBe('Actions à mener');
    expect(locale.pendingItems).toBe('Points en suspens');
    expect(locale.participants).toBe('Participants');
    expect(locale.emailGreeting).toBe('Bonjour,');
    expect(locale.emailSignoff).toBe('Cordialement');
  });

  it('falls back to English for unknown language codes', () => {
    const locale = getLocale('de');

    expect(locale.meetingReport).toBe('Meeting Report');
    expect(locale.summary).toBe('Summary');
  });

  it('falls back to English for empty string', () => {
    const locale = getLocale('');

    expect(locale.meetingReport).toBe('Meeting Report');
  });
});
