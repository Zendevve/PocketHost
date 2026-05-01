import { parseLogLine } from '../console-parser';

describe('parseLogLine', () => {
  it('parses join event', () => {
    const result = parseLogLine('[12:34:56] [Server thread/INFO]: Steve joined the game');
    expect(result).toEqual({ type: 'join', username: 'Steve' });
  });

  it('parses leave event', () => {
    const result = parseLogLine('[12:34:56] [Server thread/INFO]: Alex left the game');
    expect(result).toEqual({ type: 'leave', username: 'Alex' });
  });

  it('parses player list', () => {
    const result = parseLogLine('There are 3 of a max of 20 players online: Steve, Alex, Notch');
    expect(result).toEqual({
      type: 'list',
      count: 3,
      max: 20,
      usernames: ['Steve', 'Alex', 'Notch'],
    });
  });

  it('parses TPS (Paper 1.19.4 format)', () => {
    const result = parseLogLine('TPS from last 1m, 5m, 15m: 19.8, 20.0, 20.0');
    expect(result).toEqual({ type: 'tps', tps1m: 19.8, tps5m: 20.0, tps15m: 20.0 });
  });

  it('parses TPS (alternative format)', () => {
    const result = parseLogLine('TPS: 19.5 (1m), 20.0 (5m), 20.0 (15m)');
    expect(result).toEqual({ type: 'tps', tps1m: 19.5, tps5m: 20.0, tps15m: 20.0 });
  });

  it('parses single TPS format', () => {
    const result = parseLogLine('Current TPS: 18.2');
    expect(result).toEqual({ type: 'tps', tps1m: 18.2, tps5m: 18.2, tps15m: 18.2 });
  });

  it('parses memory (Paper format)', () => {
    const result = parseLogLine('Memory: 512 MiB / 1024 MiB');
    expect(result).toEqual({ type: 'memory', usedMB: 512, maxMB: 1024 });
  });

  it('parses memory (alternative format)', () => {
    const result = parseLogLine('Used memory: 256MB / 2048MB');
    expect(result).toEqual({ type: 'memory', usedMB: 256, maxMB: 2048 });
  });

  it('returns unknown for unmatched lines', () => {
    const result = parseLogLine('Some random server output');
    expect(result).toEqual({ type: 'unknown' });
  });

  it('returns unknown for malformed TPS', () => {
    const result = parseLogLine('Current TPS: NaN');
    expect(result).toEqual({ type: 'unknown' });
  });

  it('returns unknown for malformed memory', () => {
    const result = parseLogLine('Memory: abc MiB / def MiB');
    expect(result).toEqual({ type: 'unknown' });
  });
});
