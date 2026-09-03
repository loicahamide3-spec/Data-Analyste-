import { describe, expect, it } from 'vitest';
import { parsePastedTable, mergeWithCanonicalColumns, SURVEY_COLUMNS } from './sheetState';

describe('parsePastedTable', () => {
  it('détecte les tabulations', () => {
    const { headers, rows } = parsePastedTable('type\tname\tlabel\ntext\tnom\tQuel est votre nom ?');
    expect(headers).toEqual(['type', 'name', 'label']);
    expect(rows).toEqual([{ type: 'text', name: 'nom', label: 'Quel est votre nom ?' }]);
  });

  it('détecte le point-virgule', () => {
    const { headers, rows } = parsePastedTable('type;name;label\ntext;nom;Nom');
    expect(headers).toEqual(['type', 'name', 'label']);
    expect(rows[0]).toEqual({ type: 'text', name: 'nom', label: 'Nom' });
  });

  it('détecte le pipe', () => {
    const { headers } = parsePastedTable('type|name|label\ntext|nom|Nom');
    expect(headers).toEqual(['type', 'name', 'label']);
  });

  it('ignore les lignes vides', () => {
    const { rows } = parsePastedTable('type\tname\tlabel\n\ntext\tnom\tNom\n\n');
    expect(rows).toHaveLength(1);
  });

  it('retourne des tableaux vides sur un texte vide', () => {
    expect(parsePastedTable('')).toEqual({ headers: [], rows: [] });
  });
});

describe('mergeWithCanonicalColumns', () => {
  it('complète les colonnes manquantes à vide', () => {
    const parsed = { headers: ['type', 'name'], rows: [{ type: 'text', name: 'nom' }] };
    const merged = mergeWithCanonicalColumns(parsed, SURVEY_COLUMNS);
    expect(merged.headers).toEqual(expect.arrayContaining(SURVEY_COLUMNS));
    expect(merged.rows[0].label).toBe('');
    expect(merged.rows[0].constraint).toBe('');
  });

  it('reconnaît les colonnes dans le désordre', () => {
    const parsed = { headers: ['label', 'type', 'name'], rows: [{ label: 'Nom', type: 'text', name: 'nom' }] };
    const merged = mergeWithCanonicalColumns(parsed, SURVEY_COLUMNS);
    expect(merged.rows[0].type).toBe('text');
    expect(merged.rows[0].name).toBe('nom');
    expect(merged.rows[0].label).toBe('Nom');
  });

  it('reconnaît les colonnes insensibles à la casse', () => {
    const parsed = { headers: ['Type', 'Name', 'Label'], rows: [{ Type: 'text', Name: 'nom', Label: 'Nom' }] };
    const merged = mergeWithCanonicalColumns(parsed, SURVEY_COLUMNS);
    expect(merged.rows[0].type).toBe('text');
  });

  it('conserve les colonnes en trop à la suite des colonnes canoniques', () => {
    const parsed = { headers: ['type', 'name', 'colonne_maison'], rows: [{ type: 'text', name: 'nom', colonne_maison: 'x' }] };
    const merged = mergeWithCanonicalColumns(parsed, SURVEY_COLUMNS);
    expect(merged.headers).toContain('colonne_maison');
    expect(merged.rows[0].colonne_maison).toBe('x');
  });
});
