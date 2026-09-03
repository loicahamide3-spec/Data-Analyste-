import type { ParsedWorkbook, ParsedSheet, ValidationIssue, ValidationReport, Severity } from './types';
import { cellToString } from './types';
import {
  REQUIRED_SHEETS,
  SURVEY_REQUIRED_COLUMNS,
  CHOICES_REQUIRED_COLUMNS,
  SETTINGS_REQUIRED_COLUMNS,
  SIMPLE_TYPES,
  NON_ANALYSIS_TYPES,
  NUMERIC_TYPES,
  RESERVED_WORDS,
  NAME_REGEX,
  MAX_RECOMMENDED_NAME_LENGTH,
  SENSITIVE_KEYWORDS,
  DONT_KNOW_HINTS,
} from './constants';

export interface ValidationOptions {
  /** temps moyen par question, en secondes, pour l'estimation de durée */
  secondsPerQuestion: number;
  /** seuil d'alerte de durée, en minutes */
  maxDurationMinutes: number;
}

export const DEFAULT_OPTIONS: ValidationOptions = {
  secondsPerQuestion: 25,
  maxDurationMinutes: 45,
};

let issueSeq = 0;
function makeIssue(
  severity: Severity,
  sheet: string,
  message: string,
  opts: { row?: number; column?: string; suggestion?: string } = {},
): ValidationIssue {
  issueSeq += 1;
  return {
    id: `issue-${issueSeq}`,
    severity,
    sheet,
    row: opts.row,
    column: opts.column,
    message,
    suggestion: opts.suggestion,
  };
}

function normalizeType(rawType: string): { base: string; listName?: string } {
  const t = rawType.trim();
  if (t.startsWith('select_one ')) return { base: 'select_one', listName: t.slice('select_one '.length).trim() };
  if (t.startsWith('select_multiple '))
    return { base: 'select_multiple', listName: t.slice('select_multiple '.length).trim() };
  if (t.startsWith('select_one_from_file '))
    return { base: 'select_one_from_file', listName: t.slice('select_one_from_file '.length).trim() };
  if (t.startsWith('select_multiple_from_file '))
    return { base: 'select_multiple_from_file', listName: t.slice('select_multiple_from_file '.length).trim() };
  if (t.startsWith('rank ')) return { base: 'rank', listName: t.slice('rank '.length).trim() };
  return { base: t };
}

function isParenBalanced(expr: string): boolean {
  let depth = 0;
  for (const ch of expr) {
    if (ch === '(') depth += 1;
    else if (ch === ')') {
      depth -= 1;
      if (depth < 0) return false;
    }
  }
  return depth === 0;
}

function extractReferences(expr: string): string[] {
  const re = /\$\{([^}]+)\}/g;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(expr))) out.push(m[1].trim());
  return out;
}

export function validateXlsForm(
  workbook: ParsedWorkbook,
  options: ValidationOptions = DEFAULT_OPTIONS,
): ValidationReport {
  issueSeq = 0;
  const issues: ValidationIssue[] = [];

  // ---- 2.2 Contrôles de structure ----------------------------------
  for (const required of REQUIRED_SHEETS) {
    if (!workbook.sheetNames.includes(required)) {
      issues.push(
        makeIssue('bloquant', required, `La feuille « ${required} » est absente du classeur.`, {
          suggestion: `Ajouter une feuille nommée exactement « ${required} ».`,
        }),
      );
    }
  }

  const survey = workbook.sheets['survey'];
  const choices = workbook.sheets['choices'];
  const settings = workbook.sheets['settings'];

  if (survey) checkRequiredColumns(survey, SURVEY_REQUIRED_COLUMNS, issues);
  if (choices) checkRequiredColumns(choices, CHOICES_REQUIRED_COLUMNS, issues);
  if (settings) checkRequiredColumns(settings, SETTINGS_REQUIRED_COLUMNS, issues);

  for (const sheet of Object.values(workbook.sheets)) {
    checkEmptyRowsInMiddle(sheet, issues);
  }

  if (settings) checkSettings(settings, issues);

  // Rien d'autre à faire si la feuille survey est absente
  if (!survey) {
    return buildReport(issues, 0, options);
  }

  const surveyRows = survey.rows.filter((r) => hasAnyValue(r.values));

  // ---- 2.3 Contrôles sur les noms de variables ----------------------
  const nameOccurrences = new Map<string, number[]>();
  for (const row of surveyRows) {
    const name = cellToString(row.values['name']);
    const type = cellToString(row.values['type']);
    if (!type) continue; // ligne sans type: signalée ailleurs si nécessaire
    // end_group / end_repeat n'ont pas besoin de nom : KoboToolbox l'ignore.
    if (type === 'end_group' || type === 'end_repeat' || type === 'end repeat') continue;
    if (!name) {
      issues.push(
        makeIssue('bloquant', 'survey', `La question de type « ${type || '?'} » n'a pas de nom (colonne name).`, {
          row: row.rowNumber,
          column: 'name',
          suggestion: 'Attribuer un nom court, explicite, sans accent ni espace.',
        }),
      );
      continue;
    }

    checkVariableName(name, row.rowNumber, 'survey', issues);

    const list = nameOccurrences.get(name) ?? [];
    list.push(row.rowNumber);
    nameOccurrences.set(name, list);
  }

  for (const [name, rows] of nameOccurrences) {
    if (rows.length > 1) {
      issues.push(
        makeIssue(
          'bloquant',
          'survey',
          `Le nom de variable « ${name} » est utilisé ${rows.length} fois (lignes ${rows.join(', ')}).`,
          {
            row: rows[0],
            column: 'name',
            suggestion: 'Renommer les variables en doublon pour qu’elles soient toutes uniques.',
          },
        ),
      );
    }
  }

  // ---- 2.4 Contrôles sur les types ----------------------------------
  const validListNames = new Set<string>();
  const usedListNames = new Set<string>();
  if (choices) {
    for (const row of choices.rows) {
      const listName = cellToString(row.values['list_name']);
      if (listName) validListNames.add(listName);
    }
  }

  const groupStack: { kind: 'group' | 'repeat'; row: number }[] = [];
  const definedBefore = new Set<string>();
  const surveyNamesSet = new Set(surveyRows.map((r) => cellToString(r.values['name'])).filter(Boolean));

  for (const row of surveyRows) {
    const rawType = cellToString(row.values['type']);
    const name = cellToString(row.values['name']);
    if (!rawType) {
      issues.push(
        makeIssue('bloquant', 'survey', `La ligne n'a pas de type défini.`, {
          row: row.rowNumber,
          column: 'type',
        }),
      );
      continue;
    }

    const { base, listName } = normalizeType(rawType);

    if (base === 'begin_group' || base === 'begin repeat' || base === 'begin_repeat') {
      groupStack.push({ kind: base === 'begin_group' ? 'group' : 'repeat', row: row.rowNumber });
    } else if (base === 'end_group') {
      const top = groupStack.pop();
      if (!top || top.kind !== 'group') {
        issues.push(
          makeIssue('bloquant', 'survey', `« end_group » sans « begin_group » correspondant.`, {
            row: row.rowNumber,
            column: 'type',
            suggestion: 'Vérifier l’imbrication des groupes.',
          }),
        );
      }
    } else if (base === 'end_repeat' || base === 'end repeat') {
      const top = groupStack.pop();
      if (!top || top.kind !== 'repeat') {
        issues.push(
          makeIssue('bloquant', 'survey', `« end_repeat » sans « begin_repeat » correspondant.`, {
            row: row.rowNumber,
            column: 'type',
            suggestion: 'Vérifier l’imbrication des répétitions.',
          }),
        );
      }
    }

    const isSelect =
      base === 'select_one' || base === 'select_multiple' || base === 'select_one_from_file' || base === 'select_multiple_from_file' || base === 'rank';

    if (!SIMPLE_TYPES.includes(base) && !isSelect) {
      issues.push(
        makeIssue('bloquant', 'survey', `Le type « ${rawType} » n'est pas un type XLSForm reconnu.`, {
          row: row.rowNumber,
          column: 'type',
          suggestion: 'Vérifier l’orthographe du type (ex. « select_one », « integer », « text »…).',
        }),
      );
    }

    if (isSelect && (base === 'select_one' || base === 'select_multiple')) {
      if (!listName) {
        issues.push(
          makeIssue('bloquant', 'survey', `Le type « ${rawType} » ne précise aucune liste de choix.`, {
            row: row.rowNumber,
            column: 'type',
            suggestion: `Écrire par exemple « ${base} ma_liste ».`,
          }),
        );
      } else {
        usedListNames.add(listName);
        if (!validListNames.has(listName)) {
          issues.push(
            makeIssue(
              'bloquant',
              'survey',
              `La liste « ${listName} » utilisée pour « ${name || '(sans nom)'} » n'existe pas dans la feuille choices.`,
              {
                row: row.rowNumber,
                column: 'type',
                suggestion: `Créer la liste « ${listName} » dans choices, ou corriger le nom de liste.`,
              },
            ),
          );
        }
      }
    }

    if (base === 'calculate') {
      const calc = cellToString(row.values['calculation']);
      if (!calc) {
        issues.push(
          makeIssue('bloquant', 'survey', `La question « ${name} » de type calculate n'a pas de formule.`, {
            row: row.rowNumber,
            column: 'calculation',
            suggestion: 'Renseigner la colonne calculation avec la formule de calcul.',
          }),
        );
      }
    }

    // ---- 2.5 Références et logique --------------------------------
    for (const col of ['relevant', 'constraint', 'calculation'] as const) {
      const expr = cellToString(row.values[col]);
      if (!expr) continue;

      if (!isParenBalanced(expr)) {
        issues.push(
          makeIssue('bloquant', 'survey', `Parenthèses déséquilibrées dans « ${col} » pour « ${name} ».`, {
            row: row.rowNumber,
            column: col,
            suggestion: 'Vérifier que chaque parenthèse ouvrante a bien sa fermante.',
          }),
        );
      }

      const refs = extractReferences(expr);
      for (const ref of refs) {
        if (!surveyNamesSet.has(ref)) {
          issues.push(
            makeIssue('bloquant', 'survey', `« ${col} » de « ${name} » référence « \${${ref}} », qui n'existe pas.`, {
              row: row.rowNumber,
              column: col,
              suggestion: 'Corriger le nom référencé ou créer la variable manquante.',
            }),
          );
        } else if (!definedBefore.has(ref) && col !== 'calculation') {
          issues.push(
            makeIssue(
              'bloquant',
              'survey',
              `« ${col} » de « ${name} » référence « \${${ref}} », qui est posée après (ou à la même ligne).`,
              {
                row: row.rowNumber,
                column: col,
                suggestion: 'Déplacer la question référencée avant celle-ci, ou revoir la logique.',
              },
            ),
          );
        }
      }
    }

    const constraint = cellToString(row.values['constraint']);
    if (constraint) {
      if (!constraint.includes('.')) {
        issues.push(
          makeIssue(
            'avertissement',
            'survey',
            `La contrainte de « ${name} » ne contient pas de « . » (référence à la valeur saisie) : elle est probablement incorrecte.`,
            {
              row: row.rowNumber,
              column: 'constraint',
              suggestion: 'Utiliser « . » pour désigner la valeur saisie, ex. « . >= 0 ».',
            },
          ),
        );
      }
      const constraintMessage = cellToString(row.values['constraint_message']);
      if (!constraintMessage) {
        issues.push(
          makeIssue('avertissement', 'survey', `La contrainte de « ${name} » n'a pas de constraint_message.`, {
            row: row.rowNumber,
            column: 'constraint_message',
            suggestion: 'Ajouter un message clair expliquant la contrainte à l’enquêteur.',
          }),
        );
      }
    }

    if (name) definedBefore.add(name);

    // ---- 2.7 Qualité méthodologique --------------------------------
    const label = cellToString(row.values['label']);
    const labelOptional = base === 'calculate' || base === 'end_group' || base === 'end_repeat' || base === 'end repeat';
    if (!label && !labelOptional) {
      issues.push(
        makeIssue('avertissement', 'survey', `La question « ${name || row.rowNumber} » n'a pas de libellé (label).`, {
          row: row.rowNumber,
          column: 'label',
          suggestion: 'Renseigner un libellé compréhensible par l’enquêteur.',
        }),
      );
    }

    if (NUMERIC_TYPES.has(base) && base !== 'range') {
      if (!constraint) {
        issues.push(
          makeIssue(
            'avertissement',
            'survey',
            `La question numérique « ${name} » n'a aucune contrainte de plage (constraint).`,
            {
              row: row.rowNumber,
              column: 'constraint',
              suggestion: 'Ajouter une contrainte réaliste, ex. « . >= 0 and . <= 120 ».',
            },
          ),
        );
      }
    }

    const required = cellToString(row.values['required']).toLowerCase();
    if (required === 'yes' || required === 'true') {
      const lower = label.toLowerCase();
      const isSensitive = SENSITIVE_KEYWORDS.some((k) => lower.includes(k));
      if (isSensitive && isSelect) {
        const listRows = choices ? choices.rows.filter((r) => cellToString(r.values['list_name']) === listName) : [];
        const hasDontKnow = listRows.some((r) => {
          const l = cellToString(r.values['label']).toLowerCase();
          return DONT_KNOW_HINTS.some((h) => l.includes(h));
        });
        if (!hasDontKnow) {
          issues.push(
            makeIssue(
              'suggestion',
              'survey',
              `La question obligatoire « ${name} » aborde un sujet sensible mais ne propose pas de modalité « ne sait pas / refus ».`,
              {
                row: row.rowNumber,
                column: 'required',
                suggestion: 'Ajouter une modalité de type « ne sait pas » ou « ne souhaite pas répondre ».',
              },
            ),
          );
        }
      }
    }
  }

  if (groupStack.length > 0) {
    for (const open of groupStack) {
      issues.push(
        makeIssue(
          'bloquant',
          'survey',
          `« ${open.kind === 'group' ? 'begin_group' : 'begin_repeat'} » à la ligne ${open.row} n'est jamais fermé.`,
          {
            row: open.row,
            column: 'type',
            suggestion: `Ajouter la ligne « ${open.kind === 'group' ? 'end_group' : 'end_repeat'} » correspondante.`,
          },
        ),
      );
    }
  }

  // Libellés dupliqués entre plusieurs questions
  const labelMap = new Map<string, number[]>();
  for (const row of surveyRows) {
    const label = cellToString(row.values['label']);
    const type = cellToString(row.values['type']);
    if (!label || NON_ANALYSIS_TYPES.has(type)) continue;
    const list = labelMap.get(label) ?? [];
    list.push(row.rowNumber);
    labelMap.set(label, list);
  }
  for (const [label, rows] of labelMap) {
    if (rows.length > 1) {
      issues.push(
        makeIssue(
          'avertissement',
          'survey',
          `Le libellé « ${label} » est utilisé pour ${rows.length} questions différentes (lignes ${rows.join(', ')}).`,
          { suggestion: 'Différencier les libellés pour éviter toute confusion en collecte.' },
        ),
      );
    }
  }

  // Listes définies mais jamais utilisées
  for (const listName of validListNames) {
    if (!usedListNames.has(listName)) {
      issues.push(
        makeIssue('suggestion', 'choices', `La liste « ${listName} » n'est utilisée par aucune question du survey.`, {
          suggestion: 'Supprimer la liste si elle est inutile, ou vérifier le nom utilisé dans survey.',
        }),
      );
    }
  }

  // ---- 2.6 Contrôles sur les listes de choix -------------------------
  if (choices) checkChoices(choices, issues);

  const questionCount = surveyRows.filter((r) => {
    const t = cellToString(r.values['type']);
    const { base } = normalizeType(t);
    return !NON_ANALYSIS_TYPES.has(base) && base !== 'calculate';
  }).length;

  return buildReport(issues, questionCount, options);
}

function buildReport(issues: ValidationIssue[], questionCount: number, options: ValidationOptions): ValidationReport {
  const counts: Record<Severity, number> = { bloquant: 0, avertissement: 0, suggestion: 0 };
  for (const issue of issues) counts[issue.severity] += 1;

  const estimatedDurationMinutes = Math.round((questionCount * options.secondsPerQuestion) / 60);
  if (estimatedDurationMinutes > options.maxDurationMinutes) {
    issues.push(
      makeIssue(
        'suggestion',
        'survey',
        `La durée estimée de l'entretien (${estimatedDurationMinutes} min pour ${questionCount} questions) dépasse ${options.maxDurationMinutes} minutes.`,
        { suggestion: 'Envisager de raccourcir le questionnaire ou de le scinder en plusieurs modules.' },
      ),
    );
    counts.suggestion += 1;
  }

  return { issues, counts, estimatedDurationMinutes, questionCount };
}

function hasAnyValue(values: Record<string, unknown>): boolean {
  return Object.values(values).some((v) => cellToString(v as never) !== '');
}

function checkRequiredColumns(sheet: ParsedSheet, required: string[], issues: ValidationIssue[]) {
  for (const col of required) {
    if (!sheet.headers.includes(col)) {
      issues.push(
        makeIssue('bloquant', sheet.name, `La colonne obligatoire « ${col} » est absente de la feuille ${sheet.name}.`, {
          suggestion: `Ajouter une colonne « ${col} » en en-tête.`,
        }),
      );
    }
  }
}

function checkEmptyRowsInMiddle(sheet: ParsedSheet, issues: ValidationIssue[]) {
  if (sheet.rows.length === 0) return;
  let lastNonEmpty = -1;
  const emptyIdx: number[] = [];
  sheet.rows.forEach((row, idx) => {
    if (hasAnyValue(row.values)) lastNonEmpty = idx;
    else emptyIdx.push(idx);
  });
  for (const idx of emptyIdx) {
    if (idx < lastNonEmpty) {
      issues.push(
        makeIssue('avertissement', sheet.name, `Ligne vide au milieu de la feuille ${sheet.name}.`, {
          row: sheet.rows[idx].rowNumber,
          suggestion: 'Supprimer la ligne vide : elle peut interrompre la lecture du formulaire.',
        }),
      );
    }
  }
}

function checkSettings(settings: ParsedSheet, issues: ValidationIssue[]) {
  const row = settings.rows.find((r) => hasAnyValue(r.values));
  if (!row) {
    issues.push(
      makeIssue('bloquant', 'settings', `La feuille settings ne contient aucune ligne de valeurs.`, {
        suggestion: 'Ajouter une ligne avec au minimum form_title et form_id.',
      }),
    );
    return;
  }
  for (const col of SETTINGS_REQUIRED_COLUMNS) {
    const value = cellToString(row.values[col]);
    if (!value) {
      issues.push(
        makeIssue('bloquant', 'settings', `La valeur de « ${col} » est vide dans settings.`, {
          row: row.rowNumber,
          column: col,
          suggestion: col === 'form_id' ? 'Renseigner un identifiant unique et stable pour le formulaire.' : 'Renseigner le titre du formulaire.',
        }),
      );
    }
  }
}

function checkVariableName(name: string, rowNumber: number, sheetName: string, issues: ValidationIssue[]) {
  if (/^[0-9]/.test(name)) {
    issues.push(
      makeIssue('bloquant', sheetName, `Le nom de variable « ${name} » commence par un chiffre.`, {
        row: rowNumber,
        column: 'name',
        suggestion: 'Faire commencer le nom par une lettre ou un underscore.',
      }),
    );
  } else if (!NAME_REGEX.test(name)) {
    issues.push(
      makeIssue(
        'bloquant',
        sheetName,
        `Le nom de variable « ${name} » contient un caractère interdit (espace, accent ou symbole).`,
        {
          row: rowNumber,
          column: 'name',
          suggestion: 'N’utiliser que des lettres non accentuées, des chiffres et le caractère _ , sans commencer par un chiffre.',
        },
      ),
    );
  }

  if (RESERVED_WORDS.has(name.toLowerCase())) {
    issues.push(
      makeIssue('bloquant', sheetName, `« ${name} » est un mot réservé XLSForm et ne peut pas servir de nom de variable.`, {
        row: rowNumber,
        column: 'name',
        suggestion: 'Choisir un autre nom, par exemple en le préfixant (ex. « q_type »).',
      }),
    );
  }

  if (name.length > MAX_RECOMMENDED_NAME_LENGTH) {
    issues.push(
      makeIssue(
        'suggestion',
        sheetName,
        `Le nom de variable « ${name} » est long (${name.length} caractères).`,
        {
          row: rowNumber,
          column: 'name',
          suggestion: `Raccourcir à ${MAX_RECOMMENDED_NAME_LENGTH} caractères ou moins si possible.`,
        },
      ),
    );
  }

  if (/^[a-z]{0,2}[0-9]{1,3}$/i.test(name) || /^var[0-9]*$/i.test(name)) {
    issues.push(
      makeIssue(
        'suggestion',
        sheetName,
        `Le nom de variable « ${name} » n'est pas explicite.`,
        {
          row: rowNumber,
          column: 'name',
          suggestion: 'Utiliser un nom qui décrit le contenu de la question (ex. « age_chef_menage »).',
        },
      ),
    );
  }
}

function checkChoices(choices: ParsedSheet, issues: ValidationIssue[]) {
  const byList = new Map<string, { name: string; label: string; row: number }[]>();
  for (const row of choices.rows) {
    const listName = cellToString(row.values['list_name']);
    if (!listName) continue;
    const name = cellToString(row.values['name']);
    const label = cellToString(row.values['label']);

    if (!label) {
      issues.push(
        makeIssue('avertissement', 'choices', `La modalité « ${name || '(sans nom)'} » de la liste « ${listName} » n'a pas de libellé.`, {
          row: row.rowNumber,
          column: 'label',
          suggestion: 'Renseigner un libellé pour cette modalité.',
        }),
      );
    }

    const list = byList.get(listName) ?? [];
    list.push({ name, label, row: row.rowNumber });
    byList.set(listName, list);
  }

  for (const [listName, entries] of byList) {
    const seen = new Map<string, number[]>();
    for (const e of entries) {
      if (!e.name) continue;
      const rows = seen.get(e.name) ?? [];
      rows.push(e.row);
      seen.set(e.name, rows);
    }
    for (const [name, rows] of seen) {
      if (rows.length > 1) {
        issues.push(
          makeIssue(
            'bloquant',
            'choices',
            `La modalité « ${name} » est en doublon dans la liste « ${listName} » (lignes ${rows.join(', ')}).`,
            { row: rows[0], column: 'name', suggestion: 'Supprimer ou renommer la modalité en double.' },
          ),
        );
      }
    }

    if (entries.length === 1) {
      issues.push(
        makeIssue('suggestion', 'choices', `La liste « ${listName} » ne contient qu'une seule modalité.`, {
          suggestion: 'Vérifier que la liste est complète.',
        }),
      );
    }
  }
}
