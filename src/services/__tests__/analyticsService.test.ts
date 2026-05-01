import {
  loadPlayerSessions,
  savePlayerSessions,
  addPlayerJoin,
  addPlayerLeave,
  loadServerSessions,
  saveServerSessions,
  recordServerStart,
  recordServerStop,
  computeDailyStats,
  getTopPlayers,
  getTotalUptimeMinutes,
  getAverageSessionLength,
} from '../analyticsService';

describe('analyticsService', () => {
  beforeEach(async () => {
    await savePlayerSessions([]);
    await saveServerSessions([]);
  });

  it('tracks player join', async () => {
    await addPlayerJoin('Steve');
    const sessions = await loadPlayerSessions();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].username).toBe('Steve');
    expect(sessions[0].leftAt).toBeNull();
  });

  it('tracks player leave and calculates duration', async () => {
    const joinedAt = Date.now();
    await savePlayerSessions([{ username: 'Steve', joinedAt, leftAt: null, durationMinutes: 0 }]);
    await new Promise((r) => setTimeout(r, 10));
    await addPlayerLeave('Steve');
    const sessions = await loadPlayerSessions();
    expect(sessions[0].leftAt).not.toBeNull();
    expect(sessions[0].durationMinutes).toBeGreaterThanOrEqual(0);
  });

  it('tracks server start', async () => {
    await recordServerStart();
    const sessions = await loadServerSessions();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].stoppedAt).toBeNull();
  });

  it('tracks server stop and calculates duration', async () => {
    await recordServerStart();
    await new Promise((r) => setTimeout(r, 10));
    await recordServerStop();
    const sessions = await loadServerSessions();
    expect(sessions[0].stoppedAt).not.toBeNull();
    expect(sessions[0].durationMinutes).toBeGreaterThanOrEqual(0);
  });

  it('computes daily stats', async () => {
    const today = new Date().toISOString().split('T')[0];
    const joinedAt = new Date(today).getTime();
    await savePlayerSessions([
      { username: 'Steve', joinedAt, leftAt: joinedAt + 60000, durationMinutes: 1 },
      { username: 'Alex', joinedAt, leftAt: joinedAt + 120000, durationMinutes: 2 },
    ]);
    const stats = await computeDailyStats();
    expect(stats).toHaveLength(1);
    expect(stats[0].date).toBe(today);
    expect(stats[0].totalPlaytimeMinutes).toBe(3);
    expect(stats[0].uniquePlayers).toContain('Steve');
    expect(stats[0].uniquePlayers).toContain('Alex');
    expect(stats[0].sessionCount).toBe(2);
  });

  it('computes top players', () => {
    const sessions = [
      { username: 'Steve', joinedAt: 0, leftAt: 60000, durationMinutes: 1 },
      { username: 'Steve', joinedAt: 60000, leftAt: 180000, durationMinutes: 2 },
      { username: 'Alex', joinedAt: 0, leftAt: 120000, durationMinutes: 2 },
    ];
    const top = getTopPlayers(sessions, 2);
    expect(top).toHaveLength(2);
    expect(top[0].username).toBe('Steve');
    expect(top[0].totalMinutes).toBe(3);
  });

  it('computes total uptime', () => {
    const sessions = [
      { startedAt: 0, stoppedAt: 60000, durationMinutes: 1 },
      { startedAt: 60000, stoppedAt: 180000, durationMinutes: 2 },
    ];
    expect(getTotalUptimeMinutes(sessions)).toBe(3);
  });

  it('computes average session length', () => {
    const sessions = [
      { startedAt: 0, stoppedAt: 60000, durationMinutes: 1 },
      { startedAt: 60000, stoppedAt: 180000, durationMinutes: 2 },
    ];
    expect(getAverageSessionLength(sessions)).toBe(2);
  });
});
