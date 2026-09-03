import { describe, expect, it } from 'vitest';
import { slugifyFileName } from './slugify';

describe('slugifyFileName', () => {
  it('supprime les accents', () => {
    expect(slugifyFileName('Enquête démo')).toBe('Enquete_demo');
  });

  it('réduit les espaces et symboles à un seul underscore', () => {
    expect(slugifyFileName('mon   fichier !!  test')).toBe('mon_fichier_test');
  });

  it('retombe sur le nom par défaut si vide après nettoyage', () => {
    expect(slugifyFileName('   ', 'fallback')).toBe('fallback');
  });
});
