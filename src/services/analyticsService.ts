import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PlayerSession {
  username: string;
  joinedAt: number;
  leftAt: number | null;
  durationMinutes: number;
}

export interface ServerSession {
  startedAt: number;
  stoppedAt: number | null;
  durationMinutes: number;
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  totalPlaytimeMinutes: number;
  peakPlayers: number;
  uniquePlayers: string[];
  sessionCount: number;
}

const SESSIONS_KEY = 'pockethost_player_sessions';
const SERVER_SESSIONS_KEY = 'pockethost_server_sessions';
const DAILY_STATS_KEY = 'pockethost_daily_stats';

export async function loadPlayerSessions(): Promise<PlayerSession[]> {
  try {
    const raw = await AsyncStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function savePlayerSessions(sessions: PlayerSession[]): Promise<void> {
  await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions.slice(-500)));
}

export async function addPlayerJoin(username: string): Promise<void> {
  const sessions = await loadPlayerSessions();
  sessions.push({
    username,
    joinedAt: Date.now(),
    leftAt: null,
    durationMinutes: 0,
  });
  await savePlayerSessions(sessions);
}

export async function addPlayerLeave(username: string): Promise<void> {
  const sessions = await loadPlayerSessions();
  // Find most recent unclosed session for this player
  for (let i = sessions.length - 1; i >= 0; i--) {
    if (sessions[i].username === username && sessions[i].leftAt === null) {
      const leftAt = Date.now();
      sessions[i].leftAt = leftAt;
      sessions[i].durationMinutes = Math.round((leftAt - sessions[i].joinedAt) / 60000);
      break;
    }
  }
  await savePlayerSessions(sessions);
}

export async function loadServerSessions(): Promise<ServerSession[]> {
  try {
    const raw = await AsyncStorage.getItem(SERVER_SESSIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function saveServerSessions(sessions: ServerSession[]): Promise<void> {
  await AsyncStorage.setItem(SERVER_SESSIONS_KEY, JSON.stringify(sessions.slice(-100)));
}

export async function recordServerStart(): Promise<void> {
  const sessions = await loadServerSessions();
  sessions.push({
    startedAt: Date.now(),
    stoppedAt: null,
    durationMinutes: 0,
  });
  await saveServerSessions(sessions);
}

export async function recordServerStop(): Promise<void> {
  const sessions = await loadServerSessions();
  if (sessions.length > 0) {
    const last = sessions[sessions.length - 1];
    if (last.stoppedAt === null) {
      last.stoppedAt = Date.now();
      last.durationMinutes = Math.round((last.stoppedAt - last.startedAt) / 60000);
    }
  }
  await saveServerSessions(sessions);
}

export async function computeDailyStats(): Promise<DailyStats[]> {
  const sessions = await loadPlayerSessions();
  const serverSessions = await loadServerSessions();
  const map = new Map<string, DailyStats>();

  for (const s of sessions) {
    if (!s.leftAt) continue;
    const date = new Date(s.joinedAt).toISOString().split('T')[0];
    const existing = map.get(date);
    if (existing) {
      existing.totalPlaytimeMinutes += s.durationMinutes;
      existing.sessionCount += 1;
      if (!existing.uniquePlayers.includes(s.username)) {
        existing.uniquePlayers.push(s.username);
      }
    } else {
      map.set(date, {
        date,
        totalPlaytimeMinutes: s.durationMinutes,
        peakPlayers: 0, // computed later
        uniquePlayers: [s.username],
        sessionCount: 1,
      });
    }
  }

  // Compute peak players per day using server sessions overlap
  for (const [date, stats] of map) {
    const dayStart = new Date(date).getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;
    let peak = 0;
    for (let t = dayStart; t < dayEnd; t += 5 * 60 * 1000) {
      let count = 0;
      for (const s of sessions) {
        if (s.joinedAt <= t && (s.leftAt === null || s.leftAt >= t)) {
          count++;
        }
      }
      if (count > peak) peak = count;
    }
    stats.peakPlayers = peak;
  }

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export async function loadDailyStats(): Promise<DailyStats[]> {
  try {
    const raw = await AsyncStorage.getItem(DAILY_STATS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function saveDailyStats(stats: DailyStats[]): Promise<void> {
  await AsyncStorage.setItem(DAILY_STATS_KEY, JSON.stringify(stats.slice(-30)));
}

export function getTopPlayers(sessions: PlayerSession[], limit = 10): Array<{ username: string; totalMinutes: number }> {
  const map = new Map<string, number>();
  for (const s of sessions) {
    if (!s.leftAt) continue;
    map.set(s.username, (map.get(s.username) || 0) + s.durationMinutes);
  }
  return Array.from(map.entries())
    .map(([username, totalMinutes]) => ({ username, totalMinutes }))
    .sort((a, b) => b.totalMinutes - a.totalMinutes)
    .slice(0, limit);
}

export function getTotalUptimeMinutes(serverSessions: ServerSession[]): number {
  return serverSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
}

export function getAverageSessionLength(serverSessions: ServerSession[]): number {
  if (serverSessions.length === 0) return 0;
  const total = serverSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
  return Math.round(total / serverSessions.length);
}
