export function encodeUrl(url: string): string {
  return Buffer.from(url).toString('base64');
}

export function decodeUrl(encoded: string): string {
  return Buffer.from(encoded, 'base64').toString('utf-8');
}
