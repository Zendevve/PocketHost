export const JOIN_REGEX = /^\[\d{2}:\d{2}:\d{2}\] \[Server thread\/INFO\]: (.+?) joined the game$/;
export const LEAVE_REGEX = /^\[\d{2}:\d{2}:\d{2}\] \[Server thread\/INFO\]: (.+?) left the game$/;
export const LIST_REGEX = /^There are (\d+) of a max of (\d+) players online: (.+)$/;

// PaperMC TPS output formats vary by version.
// Defensive: try multiple patterns before giving up.
const TPS_PATTERNS = [
  // Paper 1.19.4+: "TPS from last 1m, 5m, 15m: 20.0, 20.0, 20.0"
  /TPS from last 1m, 5m, 15m:\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)/,
  // Alternative: "TPS: 20.0 (1m), 20.0 (5m), 20.0 (15m)"
  /TPS:\s*([\d.]+)\s*\(1m\),\s*([\d.]+)\s*\(5m\),\s*([\d.]+)\s*\(15m\)/,
  // Simplified single TPS: "TPS: 20.0" or "Current TPS: 20.0"
  /(?:Current\s+)?TPS:\s*([\d.]+)/,
];

// Memory patterns for different server implementations
const MEM_PATTERNS = [
  // Paper: "Memory: 512 MiB / 1024 MiB"
  /Memory:\s*([\d.]+)\s*MiB\s*\/\s*([\d.]+)\s*MiB/,
  // Alternative: "Used memory: 512MB / 1024MB"
  /Used memory:\s*([\d.]+)\s*MB?\s*\/\s*([\d.]+)\s*MB?/i,
  // Spark-style: "Memory: ■■■■□□□□□□ 512MB / 1024MB"
  /Memory:.*?([\d.]+)\s*MB?\s*\/\s*([\d.]+)\s*MB?/i,
];

export type LogEvent =
  | { type: 'join'; username: string }
  | { type: 'leave'; username: string }
  | { type: 'list'; count: number; max: number; usernames: string[] }
  | { type: 'tps'; tps1m: number; tps5m: number; tps15m: number }
  | { type: 'memory'; usedMB: number; maxMB: number }
  | { type: 'unknown' };

function safeParseFloat(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function tryParseTPS(line: string): LogEvent | null {
  for (let i = 0; i < TPS_PATTERNS.length; i++) {
    const match = line.match(TPS_PATTERNS[i]);
    if (match) {
      if (match.length >= 4) {
        // Full 1m/5m/15m pattern
        return {
          type: 'tps',
          tps1m: safeParseFloat(match[1], 20),
          tps5m: safeParseFloat(match[2], 20),
          tps15m: safeParseFloat(match[3], 20),
        };
      } else if (match.length >= 2) {
        // Single TPS pattern — replicate for all three slots
        const tps = safeParseFloat(match[1], 20);
        return { type: 'tps', tps1m: tps, tps5m: tps, tps15m: tps };
      }
    }
  }
  return null;
}

function tryParseMemory(line: string): LogEvent | null {
  for (const pattern of MEM_PATTERNS) {
    const match = line.match(pattern);
    if (match) {
      return {
        type: 'memory',
        usedMB: Math.round(safeParseFloat(match[1], 0)),
        maxMB: Math.round(safeParseFloat(match[2], 1024)),
      };
    }
  }
  return null;
}

export function parseLogLine(line: string): LogEvent {
  const joinMatch = line.match(JOIN_REGEX);
  if (joinMatch) {
    return { type: 'join', username: joinMatch[1] };
  }
  const leaveMatch = line.match(LEAVE_REGEX);
  if (leaveMatch) {
    return { type: 'leave', username: leaveMatch[1] };
  }
  const listMatch = line.match(LIST_REGEX);
  if (listMatch) {
    const usernames = listMatch[3]
      .split(',')
      .map((u) => u.trim())
      .filter(Boolean);
    return {
      type: 'list',
      count: parseInt(listMatch[1], 10),
      max: parseInt(listMatch[2], 10),
      usernames,
    };
  }

  const tpsEvent = tryParseTPS(line);
  if (tpsEvent) return tpsEvent;

  const memEvent = tryParseMemory(line);
  if (memEvent) return memEvent;

  return { type: 'unknown' };
}
