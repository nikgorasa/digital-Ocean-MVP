import { SavedSession, SessionMetadata } from "./types";

const STORAGE_KEY = "gorasa_planner_sessions";
const SESSION_EXPIRY_DAYS = 7;

function getStorageKey(): string {
  return STORAGE_KEY;
}

export function saveSession(session: SavedSession): void {
  if (typeof window === "undefined") return;

  const sessions = getAllSessions();
  const existingIndex = sessions.findIndex((s) => s.id === session.id);

  const updatedSession = {
    ...session,
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    sessions[existingIndex] = updatedSession;
  } else {
    sessions.push(updatedSession);
  }

  const cleanedSessions = sessions.filter((s) => {
    const created = new Date(s.createdAt);
    const now = new Date();
    const daysSinceCreation = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceCreation < SESSION_EXPIRY_DAYS;
  });

  localStorage.setItem(getStorageKey(), JSON.stringify(cleanedSessions));
}

export function getSession(sessionId: string): SavedSession | null {
  if (typeof window === "undefined") return null;

  const sessions = getAllSessions();
  return sessions.find((s) => s.id === sessionId) || null;
}

export function getAllSessions(): SavedSession[] {
  if (typeof window === "undefined") return [];

  try {
    const data = localStorage.getItem(getStorageKey());
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function getSessionMetadata(): SessionMetadata[] {
  const sessions = getAllSessions();
  return sessions
    .map((s) => ({
      id: s.id,
      destination: s.destination || "Unknown",
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      messageCount: s.messages.length,
    }))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function deleteSession(sessionId: string): void {
  if (typeof window === "undefined") return;

  const sessions = getAllSessions();
  const filtered = sessions.filter((s) => s.id !== sessionId);
  localStorage.setItem(getStorageKey(), JSON.stringify(filtered));
}

export function getLatestSession(): SavedSession | null {
  const sessions = getAllSessions();
  if (sessions.length === 0) return null;

  return sessions.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )[0];
}

export function hasActiveSession(): boolean {
  if (typeof window === "undefined") return false;

  const sessions = getAllSessions();
  return sessions.some((s) => {
    const created = new Date(s.createdAt);
    const now = new Date();
    const daysSinceCreation = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceCreation < SESSION_EXPIRY_DAYS;
  });
}
