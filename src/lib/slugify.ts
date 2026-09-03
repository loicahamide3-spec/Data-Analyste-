/** Nom de fichier lisible : accents supprimés, espaces et symboles réduits à des underscores. */
export function slugifyFileName(raw: string, fallback = 'fichier'): string {
  const slug = raw
    .normalize('NFD')
    .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
    .trim()
    .replace(/[^a-z0-9_-]+/gi, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return slug || fallback;
}
