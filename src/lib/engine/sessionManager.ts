const SESSION_STORAGE_KEY = 'partyverse_active_session';
const SAVED_PLAYERS_KEY = 'partyverse_saved_players';

export function saveActiveSession<T extends object>(session: T): void {
  if (typeof window === 'undefined' && typeof globalThis.localStorage === 'undefined') return;
  try {
    // Privacy safeguard: Strip ephemeral in-memory state (opt-in list, secret answers)
    // Only persist setup configuration, queues, progress, and scores.
    const sessionObj = { ...session } as Record<string, unknown>;
    delete sessionObj.optInPlayerIds;
    delete sessionObj.secretAnswer;
    delete sessionObj.ephemeralNotes;

    const serialized = JSON.stringify({
      ...sessionObj,
      updatedAt: Date.now(),
    });
    localStorage.setItem(SESSION_STORAGE_KEY, serialized);
  } catch (err) {
    console.error('Failed to save session to localStorage:', err);
  }
}

export function loadActiveSession<T extends object = Record<string, unknown>>(): T | null {
  if (typeof window === 'undefined' && typeof globalThis.localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;

    // Requirement: Legacy sessions without Normal/NSFW rating must reset to setup
    if (!parsed.rating) {
      clearActiveSession();
      return null;
    }

    // Requirement: Resuming an NSFW session requires host confirmation and re-opt-in before revealing cards
    if (parsed.rating === 'NSFW') {
      parsed.requiresResumeConfirmation = true;
    }

    return parsed as T;
  } catch (err) {
    console.error('Failed to load session from localStorage:', err);
    return null;
  }
}

export function clearActiveSession(): void {
  if (typeof window === 'undefined' && typeof globalThis.localStorage === 'undefined') return;
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear active session:', err);
  }
}

export function hasActiveSession(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(SESSION_STORAGE_KEY) !== null;
}

export function savePlayerNames(names: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SAVED_PLAYERS_KEY, JSON.stringify(names));
  } catch (err) {
    console.error('Failed to save players presets:', err);
  }
}

export function loadSavedPlayerNames(): string[] {
  if (typeof window === 'undefined') return ['คุณ A', 'คุณ B', 'คุณ C'];
  try {
    const raw = localStorage.getItem(SAVED_PLAYERS_KEY);
    if (!raw) return ['คุณ A', 'คุณ B', 'คุณ C'];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : ['คุณ A', 'คุณ B', 'คุณ C'];
  } catch {
    return ['คุณ A', 'คุณ B', 'คุณ C'];
  }
}
