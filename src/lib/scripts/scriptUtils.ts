export function escapeQuotes(s: string): string {
  return s.replace(/"/g, '\\"');
}

export function escapeSpss(s: string): string {
  return s.replace(/"/g, '""');
}
