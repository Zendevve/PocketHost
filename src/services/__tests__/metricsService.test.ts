import {
  loadMetricsHistory,
  saveMetricsHistory,
  appendMetric,
  clearMetricsHistory,
  calculateAverageTPS,
  calculateAverageMemory,
  calculatePeakPlayers,
  calculateUptimeMinutes,
} from '../metricsService';

describe('metricsService', () => {
  beforeEach(async () => {
    await clearMetricsHistory();
  });

  it('loads empty history initially', async () => {
    const history = await loadMetricsHistory();
    expect(history).toEqual([]);
  });

  it('saves and loads history', async () => {
    const snapshot = {
      timestamp: Date.now(),
      tps: 20,
      memoryUsedMB: 512,
      memoryMaxMB: 1024,
      playerCount: 2,
    };
    await appendMetric(snapshot);
    const history = await loadMetricsHistory();
    expect(history).toHaveLength(1);
    expect(history[0].tps).toBe(20);
  });

  it('updates last entry within 5 minutes instead of adding new', async () => {
    const now = Date.now();
    await appendMetric({ timestamp: now, tps: 20, memoryUsedMB: 100, memoryMaxMB: 1024, playerCount: 0 });
    await appendMetric({ timestamp: now + 1000, tps: 18, memoryUsedMB: 200, memoryMaxMB: 1024, playerCount: 1 });
    const history = await loadMetricsHistory();
    expect(history).toHaveLength(1);
    expect(history[0].tps).toBe(18);
  });

  it('adds new entry after 5 minutes', async () => {
    const now = Date.now();
    await appendMetric({ timestamp: now, tps: 20, memoryUsedMB: 100, memoryMaxMB: 1024, playerCount: 0 });
    await appendMetric({ timestamp: now + 6 * 60 * 1000, tps: 18, memoryUsedMB: 200, memoryMaxMB: 1024, playerCount: 1 });
    const history = await loadMetricsHistory();
    expect(history).toHaveLength(2);
  });

  it('calculates average TPS', () => {
    const history = [
      { timestamp: 1, tps: 20, memoryUsedMB: 100, memoryMaxMB: 1024, playerCount: 0 },
      { timestamp: 2, tps: 18, memoryUsedMB: 200, memoryMaxMB: 1024, playerCount: 1 },
    ];
    expect(calculateAverageTPS(history)).toBe(19);
  });

  it('calculates average memory', () => {
    const history = [
      { timestamp: 1, tps: 20, memoryUsedMB: 100, memoryMaxMB: 1024, playerCount: 0 },
      { timestamp: 2, tps: 18, memoryUsedMB: 200, memoryMaxMB: 1024, playerCount: 1 },
    ];
    expect(calculateAverageMemory(history)).toBe(150);
  });

  it('calculates peak players', () => {
    const history = [
      { timestamp: 1, tps: 20, memoryUsedMB: 100, memoryMaxMB: 1024, playerCount: 2 },
      { timestamp: 2, tps: 18, memoryUsedMB: 200, memoryMaxMB: 1024, playerCount: 5 },
    ];
    expect(calculatePeakPlayers(history)).toBe(5);
  });

  it('calculates uptime minutes', () => {
    const history = [
      { timestamp: 0, tps: 20, memoryUsedMB: 100, memoryMaxMB: 1024, playerCount: 0 },
      { timestamp: 60000, tps: 18, memoryUsedMB: 200, memoryMaxMB: 1024, playerCount: 1 },
    ];
    expect(calculateUptimeMinutes(history)).toBe(1);
  });
});
