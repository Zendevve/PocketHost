export const JOIN_REGEX = /^\[\d{2}:\d{2}:\d{2}\] \[Server thread\/INFO\]: (.+?) joined the game$/;
export const LEAVE_REGEX = /^\[\d{2}:\d{2}:\d{2}\] \[Server thread\/INFO\]: (.+?) left the game$/;
export const LIST_REGEX = /^There are (\d+) of a max of (\d+) players online: (.+)$/;
export const TPS_REGEX = /TPS from last 1m, 5m, 15m:\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)/;
export const MEM_REGEX = /Memory:\s*([\d.]+)\s*MiB\s*\/\s*([\d.]+)\s*MiB/;

export type LogEvent =
  | { type: 'join'; username: string }
  | { type: 'leave'; username: string }
  | { type: 'list'; count: number; max: number; usernames: string[] }
  | { type: 'tps'; tps1m: number; tps5m: number; tps15m: number }
  | { type: 'memory'; usedMB: number; maxMB: number }
  | { type: 'unknown' };

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
  const tpsMatch = line.match(TPS_REGEX);
  if (tpsMatch) {
    return {
      type: 'tps',
      tps1m: parseFloat(tpsMatch[1]),
      tps5m: parseFloat(tpsMatch[2]),
      tps15m: parseFloat(tpsMatch[3]),
    };
  }
  const memMatch = line.match(MEM_REGEX);
  if (memMatch) {
    return {
      type: 'memory',
      usedMB: Math.round(parseFloat(memMatch[1])),
      maxMB: Math.round(parseFloat(memMatch[2])),
    };
  }
  return { type: 'unknown' };
}
