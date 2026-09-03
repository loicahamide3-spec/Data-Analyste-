import { describe, expect, it } from 'vitest';
import { buildVariableDictionary } from './dictionary';
import { generateSpssScript } from './spss';
import { generateStataScript } from './stata';
import { generateRScript } from './r';
import { makeWorkbook, DEFAULT_SETTINGS } from '../../test/wbHelpers';

const surveyHeaders = ['type', 'name', 'label', 'constraint'];
const choicesHeaders = ['list_name', 'name', 'label'];

function sampleWorkbook() {
  return makeWorkbook({
    survey: {
      headers: surveyHeaders,
      rows: [
        { type: 'integer', name: 'age', label: 'Âge', constraint: '' },
        { type: 'select_one sexe', name: 'sexe', label: 'Sexe', constraint: '' },
        { type: 'select_multiple equip', name: 'equipements', label: 'Équipements', constraint: '' },
        { type: 'begin_group', name: 'grp', label: 'Groupe', constraint: '' },
        { type: 'integer', name: 'nb_personnes', label: 'Nombre de personnes', constraint: '' },
        { type: 'end_group', name: '', label: '', constraint: '' },
        { type: 'begin_repeat', name: 'rpt', label: 'Parcelle', constraint: '' },
        { type: 'decimal', name: 'superficie', label: 'Superficie', constraint: '' },
        { type: 'end_repeat', name: '', label: '', constraint: '' },
        { type: 'note', name: 'note1', label: 'Une note', constraint: '' },
        { type: 'calculate', name: 'calc1', label: '', constraint: '' },
      ],
    },
    choices: {
      headers: choicesHeaders,
      rows: [
        { list_name: 'sexe', name: '1', label: 'Homme' },
        { list_name: 'sexe', name: '2', label: 'Femme' },
        { list_name: 'equip', name: '1', label: 'Électricité' },
        { list_name: 'equip', name: '2', label: 'Eau courante' },
      ],
    },
    settings: DEFAULT_SETTINGS,
  });
}

describe('buildVariableDictionary', () => {
  it('exclut note, begin/end_group, begin/end_repeat et calculate', () => {
    const vars = buildVariableDictionary(sampleWorkbook());
    const names = vars.map((v) => v.name);
    expect(names).not.toContain('note1');
    expect(names).not.toContain('calc1');
    expect(names).not.toContain('grp');
    expect(names).not.toContain('rpt');
  });

  it('repère les questions dans une répétition', () => {
    const vars = buildVariableDictionary(sampleWorkbook());
    const superficie = vars.find((v) => v.name === 'superficie');
    expect(superficie?.inRepeat).toBe(true);
    const age = vars.find((v) => v.name === 'age');
    expect(age?.inRepeat).toBe(false);
  });

  it('résout les listes de choix', () => {
    const vars = buildVariableDictionary(sampleWorkbook());
    const sexe = vars.find((v) => v.name === 'sexe');
    expect(sexe?.choices).toEqual([
      { code: '1', label: 'Homme' },
      { code: '2', label: 'Femme' },
    ]);
  });

  it('identifie les select_multiple', () => {
    const vars = buildVariableDictionary(sampleWorkbook());
    const equip = vars.find((v) => v.name === 'equipements');
    expect(equip?.isSelectMultiple).toBe(true);
  });
});

describe('générateurs de scripts', () => {
  const vars = buildVariableDictionary(sampleWorkbook());

  it('SPSS conserve les noms de variables identiques au XLSForm', () => {
    const script = generateSpssScript(vars, 'Titre');
    expect(script).toContain('age "Âge"');
    expect(script).toContain('sexe');
    expect(script).not.toContain('grp');
  });

  it('SPSS décompose les select_multiple en colonnes binaires', () => {
    const script = generateSpssScript(vars, 'Titre');
    expect(script).toContain('equipements_1');
    expect(script).toContain('equipements_2');
  });

  it('SPSS signale les variables en répétition', () => {
    const script = generateSpssScript(vars, 'Titre');
    expect(script).toContain('superficie');
    expect(script).toMatch(/répétition/);
  });

  it('Stata définit un label pour chaque variable à choix', () => {
    const script = generateStataScript(vars, 'Titre');
    expect(script).toContain('label define sexe_lbl 1 "Homme" 2 "Femme"');
    expect(script).toContain('label values sexe sexe_lbl');
  });

  it('R convertit les variables à choix en facteurs', () => {
    const script = generateRScript(vars, 'Titre');
    expect(script).toContain('donnees$sexe <- factor(donnees$sexe');
    expect(script).toContain('levels = c("1", "2")');
    expect(script).toContain('labels = c("Homme", "Femme")');
  });
});
