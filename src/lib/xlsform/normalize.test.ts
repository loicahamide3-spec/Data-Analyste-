import { describe, expect, it } from 'vitest';
import { normalizeVariableName, autoFixWorkbook } from './normalize';
import { emptySheetState, SURVEY_COLUMNS, CHOICES_COLUMNS, SETTINGS_COLUMNS } from './sheetState';
import { validateXlsForm, DEFAULT_OPTIONS } from './validate';
import { buildWorkbookFromState } from './sheetState';

describe('normalizeVariableName', () => {
  it('supprime les accents et espaces', () => {
    expect(normalizeVariableName('Nom du répondant')).toBe('nom_du_repondant');
  });

  it('préfixe un nom commençant par un chiffre', () => {
    expect(normalizeVariableName('1er_enfant')).toBe('q_1er_enfant');
  });

  it('retombe sur "variable" si le nom est vide après nettoyage', () => {
    expect(normalizeVariableName('###')).toBe('variable');
  });

  it('est idempotent sur un nom déjà valide', () => {
    expect(normalizeVariableName('age_repondant')).toBe('age_repondant');
  });
});

describe('autoFixWorkbook', () => {
  it('renomme les doublons de noms de variables avec un suffixe', () => {
    const survey = {
      headers: SURVEY_COLUMNS,
      rows: [
        { type: 'text', name: 'nom', label: 'A' },
        { type: 'text', name: 'nom', label: 'B' },
      ],
    };
    const choices = emptySheetState(CHOICES_COLUMNS);
    const settings = emptySheetState(SETTINGS_COLUMNS);

    const result = autoFixWorkbook(survey, choices, settings);
    const names = result.survey.rows.map((r) => r.name);
    expect(new Set(names).size).toBe(2);
  });

  it('complète settings (form_title, form_id, version)', () => {
    const survey = emptySheetState(SURVEY_COLUMNS);
    const choices = emptySheetState(CHOICES_COLUMNS);
    const settings = { headers: SETTINGS_COLUMNS, rows: [{ form_title: '', form_id: '', version: '', default_language: '' }] };

    const result = autoFixWorkbook(survey, choices, settings);
    expect(result.settings.rows[0].form_title).not.toBe('');
    expect(result.settings.rows[0].form_id).not.toBe('');
    expect(result.settings.rows[0].version).not.toBe('');
  });

  it('supprime les doublons exacts dans choices', () => {
    const survey = emptySheetState(SURVEY_COLUMNS);
    const choices = {
      headers: CHOICES_COLUMNS,
      rows: [
        { list_name: 'sexe', name: '1', label: 'Homme' },
        { list_name: 'sexe', name: '1', label: 'Homme' },
      ],
    };
    const settings = emptySheetState(SETTINGS_COLUMNS);

    const result = autoFixWorkbook(survey, choices, settings);
    expect(result.choices.rows).toHaveLength(1);
  });

  it("ajoute une contrainte par défaut sur les questions numériques sans contrainte", () => {
    const survey = { headers: SURVEY_COLUMNS, rows: [{ type: 'integer', name: 'age', label: 'Âge' }] };
    const choices = emptySheetState(CHOICES_COLUMNS);
    const settings = emptySheetState(SETTINGS_COLUMNS);

    const result = autoFixWorkbook(survey, choices, settings);
    expect(result.survey.rows[0].constraint).toBe('. >= 0');
  });

  it('produit un formulaire sans erreur bloquante après correction (le module 2 doit passer le module 1)', () => {
    const survey = {
      headers: SURVEY_COLUMNS,
      rows: [
        { type: 'text', name: 'Nom du répondant', label: 'Nom' },
        { type: 'text', name: 'Nom du répondant', label: 'Nom bis' },
        { type: 'integer', name: '1age', label: 'Âge' },
      ],
    };
    const choices = emptySheetState(CHOICES_COLUMNS);
    const settings = emptySheetState(SETTINGS_COLUMNS);

    const fixed = autoFixWorkbook(survey, choices, settings);
    const workbook = buildWorkbookFromState('fixed.xlsx', fixed.survey, fixed.choices, fixed.settings);
    const report = validateXlsForm(workbook, DEFAULT_OPTIONS);
    expect(report.counts.bloquant).toBe(0);
  });
});
