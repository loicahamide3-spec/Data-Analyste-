import { describe, expect, it } from 'vitest';
import {
  computeCompleteness,
  detectDuplicates,
  detectOutliers,
  computeCollectionStats,
  detectCrossFieldInconsistencies,
} from './qualityChecks';
import type { KoboDataset } from './importKobo';
import type { DictVariable } from '../scripts/dictionary';

function makeVar(partial: Partial<DictVariable> & { name: string }): DictVariable {
  return {
    label: '',
    type: 'integer',
    baseType: 'integer',
    groupPath: [],
    inRepeat: false,
    isSelectMultiple: false,
    isNumeric: true,
    choices: [],
    ...partial,
  };
}

describe('computeCompleteness', () => {
  it('calcule le taux de remplissage en excluant les colonnes techniques', () => {
    const dataset: KoboDataset = {
      fileName: 'x.csv',
      headers: ['_id', 'age', 'sexe'],
      rows: [
        { _id: '1', age: '20', sexe: '' },
        { _id: '2', age: '', sexe: '1' },
      ],
    };
    const rows = computeCompleteness(dataset);
    expect(rows.find((r) => r.column === '_id')).toBeUndefined();
    expect(rows.find((r) => r.column === 'age')?.rate).toBe(50);
  });
});

describe('detectDuplicates', () => {
  it("détecte les enregistrements identiques hors colonnes techniques", () => {
    const dataset: KoboDataset = {
      fileName: 'x.csv',
      headers: ['_id', 'age', 'sexe'],
      rows: [
        { _id: '1', age: '20', sexe: '1' },
        { _id: '2', age: '20', sexe: '1' },
        { _id: '3', age: '30', sexe: '2' },
      ],
    };
    const dups = detectDuplicates(dataset);
    expect(dups).toHaveLength(1);
    expect(dups[0].rowIndexes).toEqual([0, 1]);
  });
});

describe('detectOutliers', () => {
  it('utilise la contrainte du XLSForm quand disponible', () => {
    const dataset: KoboDataset = {
      fileName: 'x.csv',
      headers: ['age'],
      rows: [{ age: '25' }, { age: '999' }, { age: '40' }],
    };
    const variables = [makeVar({ name: 'age', constraint: '. >= 0 and . <= 120' })];
    const outliers = detectOutliers(dataset, variables, 1.5);
    expect(outliers).toHaveLength(1);
    expect(outliers[0].source).toBe('constraint');
    expect(outliers[0].count).toBe(1);
  });

  it("repli sur la méthode interquartile sans contrainte", () => {
    const dataset: KoboDataset = {
      fileName: 'x.csv',
      headers: ['revenu'],
      rows: [{ revenu: '100' }, { revenu: '110' }, { revenu: '105' }, { revenu: '95' }, { revenu: '100000' }],
    };
    const outliers = detectOutliers(dataset, [], 1.5);
    expect(outliers).toHaveLength(1);
    expect(outliers[0].source).toBe('statistique');
  });
});

describe('detectCrossFieldInconsistencies', () => {
  it('détecte une date de fin antérieure à la date de début via une contrainte « . >= ${...} »', () => {
    const dataset: KoboDataset = {
      fileName: 'x.csv',
      headers: ['date_debut', 'date_fin'],
      rows: [
        { date_debut: '2026-01-01', date_fin: '2026-01-05' },
        { date_debut: '2026-02-10', date_fin: '2026-02-01' },
      ],
    };
    const variables = [makeVar({ name: 'date_fin', constraint: '. >= ${date_debut}' })];
    const issues = detectCrossFieldInconsistencies(dataset, variables);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ column: 'date_fin', relatedColumn: 'date_debut', count: 1 });
  });

  it('ignore les lignes où une des deux valeurs est vide', () => {
    const dataset: KoboDataset = {
      fileName: 'x.csv',
      headers: ['a', 'b'],
      rows: [{ a: '', b: '10' }, { a: '5', b: '' }],
    };
    const variables = [makeVar({ name: 'a', constraint: '. >= ${b}' })];
    expect(detectCrossFieldInconsistencies(dataset, variables)).toHaveLength(0);
  });

  it('ne signale rien quand aucune contrainte ne référence une autre variable', () => {
    const dataset: KoboDataset = { fileName: 'x.csv', headers: ['age'], rows: [{ age: '20' }] };
    const variables = [makeVar({ name: 'age', constraint: '. >= 0 and . <= 120' })];
    expect(detectCrossFieldInconsistencies(dataset, variables)).toHaveLength(0);
  });
});

describe('computeCollectionStats', () => {
  it('calcule la durée moyenne à partir de start/end', () => {
    const dataset: KoboDataset = {
      fileName: 'x.csv',
      headers: ['start', 'end'],
      rows: [
        { start: '2026-01-01T10:00:00', end: '2026-01-01T10:10:00' },
        { start: '2026-01-01T11:00:00', end: '2026-01-01T11:20:00' },
      ],
    };
    const stats = computeCollectionStats(dataset);
    expect(stats.totalSubmissions).toBe(2);
    expect(stats.averageDurationMinutes).toBe(15);
  });

  it("répartit par enquêteur quand la colonne existe", () => {
    const dataset: KoboDataset = {
      fileName: 'x.csv',
      headers: ['nom_enqueteur'],
      rows: [{ nom_enqueteur: 'Awa' }, { nom_enqueteur: 'Awa' }, { nom_enqueteur: 'Moussa' }],
    };
    const stats = computeCollectionStats(dataset);
    expect(stats.byEnumerator).toEqual([
      { name: 'Awa', count: 2 },
      { name: 'Moussa', count: 1 },
    ]);
  });
});
