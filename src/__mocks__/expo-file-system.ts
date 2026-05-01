export const documentDirectory = '/mock/documents/';

export enum EncodingType {
  Base64 = 'base64',
  UTF8 = 'utf8',
}

export async function readDirectoryAsync(dir: string): Promise<string[]> {
  return [];
}

export async function getInfoAsync(path: string): Promise<any> {
  return { exists: false, isDirectory: false, uri: path };
}

export async function makeDirectoryAsync(path: string, options?: { intermediates?: boolean }): Promise<void> {}

export async function readAsStringAsync(path: string, options?: { encoding?: EncodingType }): Promise<string> {
  return '';
}

export async function writeAsStringAsync(path: string, content: string, options?: { encoding?: EncodingType }): Promise<void> {}

export async function deleteAsync(path: string, options?: { idempotent?: boolean }): Promise<void> {}

export async function moveAsync(options: { from: string; to: string }): Promise<void> {}

export async function copyAsync(options: { from: string; to: string }): Promise<void> {}
