import type { ParsedWorkbook } from '../xlsform/types';
import { cellToString } from '../xlsform/types';
import { NON_ANALYSIS_TYPES, NUMERIC_TYPES } from '../xlsform/constants';

export interface DictChoice {
  code: string;
  label: string;
}

export interface DictVariable {
  name: string;
  label: string;
  type: string;
  baseType: string;
  groupPath: string[];
  inRepeat: boolean;
  isSelectMultiple: boolean;
  isNumeric: boolean;
  listName?: string;
  choices: DictChoice[];
  constraint?: string;
}

function normalizeType(rawType: string): { base: string; listName?: string } {
  const t = rawType.trim();
  const prefixes = ['select_one_from_file ', 'select_multiple_from_file ', 'select_one ', 'select_multiple ', 'rank '];
  for (const p of prefixes) {
    if (t.startsWith(p)) return { base: p.trim(), listName: t.slice(p.length).trim() };
  }
  return { base: t };
}

/**
 * Construit le dictionnaire des variables d'analyse à partir d'un XLSForm :
 * exclut les note/begin_group/end_group/begin_repeat/end_repeat, résout les
 * listes de choix, et repère les questions situées dans un repeat (export
 * Kobo séparé) ou un groupe (préfixe possible dans les noms de colonnes).
 */
export function buildVariableDictionary(workbook: ParsedWorkbook): DictVariable[] {
  const survey = workbook.sheets['survey'];
  const choices = workbook.sheets['choices'];
  if (!survey) return [];

  const variables: DictVariable[] = [];
  const groupStack: string[] = [];
  let repeatDepth = 0;

  for (const row of survey.rows) {
    const rawType = cellToString(row.values['type']);
    if (!rawType) continue;
    const name = cellToString(row.values['name']);
    const label = cellToString(row.values['label']);

    const { base, listName } = normalizeType(rawType);

    if (base === 'begin_group') {
      groupStack.push(name);
      continue;
    }
    if (base === 'end_group') {
      groupStack.pop();
      continue;
    }
    if (base === 'begin_repeat' || base === 'begin repeat') {
      groupStack.push(name);
      repeatDepth += 1;
      continue;
    }
    if (base === 'end_repeat' || base === 'end repeat') {
      groupStack.pop();
      repeatDepth = Math.max(0, repeatDepth - 1);
      continue;
    }
    if (NON_ANALYSIS_TYPES.has(base) || base === 'calculate' || !name) continue;

    const isSelectMultiple = base === 'select_multiple' || base === 'select_multiple_from_file';
    const isNumeric = NUMERIC_TYPES.has(base);

    const listChoices: DictChoice[] =
      listName && choices
        ? choices.rows
            .filter((c) => cellToString(c.values['list_name']) === listName)
            .map((c) => ({ code: cellToString(c.values['name']), label: cellToString(c.values['label']) }))
        : [];

    variables.push({
      name,
      label,
      type: rawType,
      baseType: base,
      groupPath: [...groupStack],
      inRepeat: repeatDepth > 0,
      isSelectMultiple,
      isNumeric,
      listName,
      choices: listChoices,
      constraint: cellToString(row.values['constraint']) || undefined,
    });
  }

  return variables;
}

/** Nom de variable pour un script d'analyse : la version brute et la version préfixée par le groupe. */
export function variableNameVariants(v: DictVariable): { flat: string; grouped: string } {
  const grouped = v.groupPath.length > 0 ? `${v.groupPath.join('_')}_${v.name}` : v.name;
  return { flat: v.name, grouped };
}

/** Nom de sous-variable pour une modalité d'un select_multiple, tel que généré par les scripts. */
export function subVariableName(v: DictVariable, choiceCode: string): string {
  return `${v.name}_${choiceCode}`;
}
