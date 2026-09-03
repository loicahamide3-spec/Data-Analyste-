import type { SheetState } from './sheetState';
import { NUMERIC_TYPES } from './constants';

/** Supprime les accents, espaces et caractères spéciaux d'un nom de variable. */
export function normalizeVariableName(raw: string): string {
  let s = raw
    .normalize('NFD')
    .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '') // diacritiques
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (!s) s = 'variable';
  if (/^[0-9]/.test(s)) s = `q_${s}`;
  return s;
}

function todayVersion(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}`;
}

export interface AutoFixResult {
  survey: SheetState;
  choices: SheetState;
  settings: SheetState;
  changes: string[];
}

/**
 * Corrige en un clic les anomalies mécaniques : noms de variables non
 * conformes, doublons de noms, settings incomplet, contraintes de plage
 * absentes sur les questions numériques.
 */
export function autoFixWorkbook(survey: SheetState, choices: SheetState, settings: SheetState): AutoFixResult {
  const changes: string[] = [];

  // ---- Noms de variables (survey) -----------------------------------
  const usedNames = new Set<string>();
  const newSurveyRows = survey.rows.map((row) => {
    const type = (row['type'] ?? '').trim();
    if (!type) return row;
    const original = (row['name'] ?? '').trim();
    let normalized = original ? normalizeVariableName(original) : normalizeVariableName(`variable_${usedNames.size + 1}`);

    let candidate = normalized;
    let suffix = 2;
    while (usedNames.has(candidate)) {
      candidate = `${normalized}_${suffix}`;
      suffix += 1;
    }
    usedNames.add(candidate);

    if (candidate !== original) {
      changes.push(`Nom de variable « ${original || '(vide)'} » renommé en « ${candidate} ».`);
    }

    const newRow: Record<string, string> = { ...row, name: candidate };

    if (NUMERIC_TYPES.has(type) && type !== 'range' && !(row['constraint'] ?? '').trim()) {
      newRow['constraint'] = '. >= 0';
      changes.push(`Contrainte par défaut « . >= 0 » ajoutée sur « ${candidate} » (à ajuster).`);
    }

    return newRow;
  });

  // ---- Doublons dans choices (même list_name + name) -----------------
  const seenChoiceKeys = new Set<string>();
  const newChoiceRows: Record<string, string>[] = [];
  for (const row of choices.rows) {
    const listName = (row['list_name'] ?? '').trim();
    const name = (row['name'] ?? '').trim();
    if (!listName && !name) continue;
    const key = `${listName}::${name}`;
    if (seenChoiceKeys.has(key)) {
      changes.push(`Modalité en doublon « ${name} » supprimée de la liste « ${listName} ».`);
      continue;
    }
    seenChoiceKeys.add(key);
    newChoiceRows.push(row);
  }

  // ---- Settings ------------------------------------------------------
  const settingsRow = { ...(settings.rows[0] ?? {}) };
  for (const h of settings.headers) if (!(h in settingsRow)) settingsRow[h] = '';

  if (!settingsRow['form_title']?.trim()) {
    settingsRow['form_title'] = 'Enquête sans titre';
    changes.push('form_title complété automatiquement (« Enquête sans titre »).');
  }
  if (!settingsRow['form_id']?.trim()) {
    settingsRow['form_id'] = normalizeVariableName(settingsRow['form_title'] || 'enquete');
    changes.push(`form_id complété automatiquement (« ${settingsRow['form_id']} »).`);
  }
  if (!settingsRow['version']?.trim()) {
    settingsRow['version'] = todayVersion();
    changes.push(`version datée ajoutée (« ${settingsRow['version']} »).`);
  }

  return {
    survey: { headers: survey.headers, rows: newSurveyRows },
    choices: { headers: choices.headers, rows: newChoiceRows },
    settings: { headers: settings.headers, rows: [settingsRow] },
    changes,
  };
}
