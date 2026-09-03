import { describe, expect, it } from 'vitest';
import { prepareDataset } from './prepare';
import type { KoboDataset } from './importKobo';
import type { DictVariable } from '../scripts/dictionary';

function makeSelectMultipleVar(): DictVariable {
  return {
    name: 'equipements',
    label: 'Équipements',
    type: 'select_multiple equip',
    baseType: 'select_multiple',
    groupPath: [],
    inRepeat: false,
    isSelectMultiple: true,
    isNumeric: false,
    choices: [
      { code: '1', label: 'Électricité' },
      { code: '2', label: 'Eau courante' },
    ],
  };
}

describe('prepareDataset — décomposition/recomposition des select_multiple', () => {
  it('décompose une colonne "nom" en colonnes binaires par modalité', () => {
    const dataset: KoboDataset = {
      fileName: 'x.csv',
      headers: ['equipements'],
      rows: [{ equipements: '1 2' }, { equipements: '2' }],
    };
    const result = prepareDataset(dataset, [makeSelectMultipleVar()], {
      removeTechnicalColumns: false,
      selectMultipleMode: 'decompose',
      replaceCodesWithLabels: false,
      columnsToAnonymize: [],
      anonymizeMode: 'remove',
    });
    expect(result.dataset.headers).toContain('equipements_1');
    expect(result.dataset.headers).toContain('equipements_2');
    expect(result.dataset.rows[0]).toMatchObject({ equipements_1: '1', equipements_2: '1' });
    expect(result.dataset.rows[1]).toMatchObject({ equipements_1: '0', equipements_2: '1' });
  });

  it('recompose des colonnes binaires "nom/code" (export Kobo brut) en une liste de codes', () => {
    const dataset: KoboDataset = {
      fileName: 'x.csv',
      headers: ['equipements/1', 'equipements/2'],
      rows: [
        { 'equipements/1': '1', 'equipements/2': '0' },
        { 'equipements/1': 'True', 'equipements/2': 'True' },
      ],
    };
    const result = prepareDataset(dataset, [makeSelectMultipleVar()], {
      removeTechnicalColumns: false,
      selectMultipleMode: 'recompose',
      replaceCodesWithLabels: false,
      columnsToAnonymize: [],
      anonymizeMode: 'remove',
    });
    expect(result.dataset.headers).toContain('equipements');
    expect(result.dataset.headers).not.toContain('equipements/1');
    expect(result.dataset.rows[0].equipements).toBe('1');
    expect(result.dataset.rows[1].equipements).toBe('1 2');
  });

  it('recompose des colonnes binaires "nom_code" (décomposées par cet outil)', () => {
    const dataset: KoboDataset = {
      fileName: 'x.csv',
      headers: ['equipements_1', 'equipements_2'],
      rows: [{ equipements_1: '0', equipements_2: '1' }],
    };
    const result = prepareDataset(dataset, [makeSelectMultipleVar()], {
      removeTechnicalColumns: false,
      selectMultipleMode: 'recompose',
      replaceCodesWithLabels: false,
      columnsToAnonymize: [],
      anonymizeMode: 'remove',
    });
    expect(result.dataset.rows[0].equipements).toBe('2');
  });

  it('un aller-retour décompose puis recompose restitue la même liste de codes', () => {
    const dataset: KoboDataset = { fileName: 'x.csv', headers: ['equipements'], rows: [{ equipements: '1 2' }] };
    const decomposed = prepareDataset(dataset, [makeSelectMultipleVar()], {
      removeTechnicalColumns: false,
      selectMultipleMode: 'decompose',
      replaceCodesWithLabels: false,
      columnsToAnonymize: [],
      anonymizeMode: 'remove',
    });
    const recomposed = prepareDataset(decomposed.dataset, [makeSelectMultipleVar()], {
      removeTechnicalColumns: false,
      selectMultipleMode: 'recompose',
      replaceCodesWithLabels: false,
      columnsToAnonymize: [],
      anonymizeMode: 'remove',
    });
    expect(recomposed.dataset.rows[0].equipements).toBe('1 2');
  });
});

describe('prepareDataset — autres opérations', () => {
  it('remplace les codes par les libellés pour un select_one', () => {
    const dataset: KoboDataset = { fileName: 'x.csv', headers: ['sexe'], rows: [{ sexe: '1' }, { sexe: '2' }] };
    const sexeVar: DictVariable = {
      name: 'sexe',
      label: 'Sexe',
      type: 'select_one sexe',
      baseType: 'select_one',
      groupPath: [],
      inRepeat: false,
      isSelectMultiple: false,
      isNumeric: false,
      choices: [
        { code: '1', label: 'Homme' },
        { code: '2', label: 'Femme' },
      ],
    };
    const result = prepareDataset(dataset, [sexeVar], {
      removeTechnicalColumns: false,
      selectMultipleMode: 'none',
      replaceCodesWithLabels: true,
      columnsToAnonymize: [],
      anonymizeMode: 'remove',
    });
    expect(result.dataset.rows[0].sexe).toBe('Homme');
    expect(result.dataset.rows[1].sexe).toBe('Femme');
  });

  it('supprime les colonnes techniques Kobo', () => {
    const dataset: KoboDataset = { fileName: 'x.csv', headers: ['_id', '_uuid', 'age'], rows: [{ _id: '1', _uuid: 'u', age: '20' }] };
    const result = prepareDataset(dataset, [], {
      removeTechnicalColumns: true,
      selectMultipleMode: 'none',
      replaceCodesWithLabels: false,
      columnsToAnonymize: [],
      anonymizeMode: 'remove',
    });
    expect(result.dataset.headers).toEqual(['age']);
  });

  it('anonymise en supprimant ou en masquant', () => {
    const dataset: KoboDataset = { fileName: 'x.csv', headers: ['nom', 'age'], rows: [{ nom: 'Jean', age: '20' }] };
    const removed = prepareDataset(dataset, [], {
      removeTechnicalColumns: false,
      selectMultipleMode: 'none',
      replaceCodesWithLabels: false,
      columnsToAnonymize: ['nom'],
      anonymizeMode: 'remove',
    });
    expect(removed.dataset.headers).not.toContain('nom');

    const masked = prepareDataset(dataset, [], {
      removeTechnicalColumns: false,
      selectMultipleMode: 'none',
      replaceCodesWithLabels: false,
      columnsToAnonymize: ['nom'],
      anonymizeMode: 'mask',
    });
    expect(masked.dataset.rows[0].nom).toBe('MASQUÉ');
  });
});
