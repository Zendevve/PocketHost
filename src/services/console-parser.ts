export const JOIN_REGEX = /^\[\d{2}:\d{2}:\d{2}\] \[Server thread\/INFO\]: (.+?) joined the game$/;
export const LEAVE_REGEX = /^\[\d{2}:\d{2}:\d{2}\] \[Server thread\/INFO\]: (.+?) left the game$/;
export const LIST_REGEX = /^There are (\d+) of a max of (\d+) players online: (.+)$/;

export type LogEvent =
  | { type: 'join'; username: string }
  | { type: 'leave'; username: string }
  | { type: 'list'; count: number; max: number; usernames: string[] }
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
  return { type: 'unknown' };
}
