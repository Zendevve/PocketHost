import AsyncStorage from '@react-native-async-storage/async-storage';

export interface MetricsSnapshot {
  timestamp: number;
  tps: number;
  memoryUsedMB: number;
  memoryMaxMB: number;
  playerCount: number;
  // cpuPercent would require native module; skip for now
}

const METRICS_KEY = 'pockethost_metrics_history';
const MAX_HISTORY_POINTS = 288; // 5-minute intervals for 24 hours

export async function loadMetricsHistory(): Promise<MetricsSnapshot[]> {
  try {
    const raw = await AsyncStorage.getItem(METRICS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveMetricsHistory(history: MetricsSnapshot[]): Promise<void> {
  try {
    await AsyncStorage.setItem(METRICS_KEY, JSON.stringify(history.slice(-MAX_HISTORY_POINTS)));
  } catch {
    // ignore
  }
}

export async function appendMetric(snapshot: MetricsSnapshot): Promise<MetricsSnapshot[]> {
  const history = await loadMetricsHistory();
  // Only add if enough time passed (5 min) or history is empty
  if (history.length === 0 || snapshot.timestamp - history[history.length - 1].timestamp >= 5 * 60 * 1000) {
    history.push(snapshot);
  } else {
    // Update the last entry if within 5 minutes
    history[history.length - 1] = snapshot;
  }
  const trimmed = history.slice(-MAX_HISTORY_POINTS);
  await saveMetricsHistory(trimmed);
  return trimmed;
}

export async function clearMetricsHistory(): Promise<void> {
  await AsyncStorage.removeItem(METRICS_KEY);
}

export function calculateAverageTPS(history: MetricsSnapshot[]): number {
  if (history.length === 0) return 20;
  const sum = history.reduce((acc, m) => acc + m.tps, 0);
  return Math.round((sum / history.length) * 10) / 10;
}

export function calculateAverageMemory(history: MetricsSnapshot[]): number {
  if (history.length === 0) return 0;
  const sum = history.reduce((acc, m) => acc + m.memoryUsedMB, 0);
  return Math.round(sum / history.length);
}

export function calculatePeakPlayers(history: MetricsSnapshot[]): number {
  if (history.length === 0) return 0;
  return Math.max(...history.map((m) => m.playerCount));
}

export function calculateUptimeMinutes(history: MetricsSnapshot[]): number {
  if (history.length < 2) return 0;
  const first = history[0].timestamp;
  const last = history[history.length - 1].timestamp;
  return Math.round((last - first) / 60000);
}
