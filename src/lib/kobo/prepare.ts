import type { KoboDataset } from './importKobo';
import type { DictVariable } from '../scripts/dictionary';
import { isTechnicalColumn } from './technicalColumns';

export interface PrepareOptions {
  removeTechnicalColumns: boolean;
  decomposeSelectMultiple: boolean;
  replaceCodesWithLabels: boolean;
  columnsToAnonymize: string[];
  anonymizeMode: 'remove' | 'mask';
}

export interface PrepareResult {
  dataset: KoboDataset;
  operations: string[];
}

/**
 * Applique les opérations de préparation demandées et retourne le jeu de
 * données nettoyé, accompagné du journal des opérations effectuées
 * (traçabilité méthodologique).
 */
export function prepareDataset(dataset: KoboDataset, variables: DictVariable[], options: PrepareOptions): PrepareResult {
  const operations: string[] = [];
  let headers = [...dataset.headers];
  let rows = dataset.rows.map((r) => ({ ...r }));

  const byName = new Map(variables.map((v) => [v.name, v]));

  if (options.decomposeSelectMultiple) {
    const selectMultiples = variables.filter((v) => v.isSelectMultiple && headers.includes(v.name));
    for (const v of selectMultiples) {
      const newCols = v.choices.map((c) => `${v.name}_${c.code}`);
      rows = rows.map((row) => {
        const raw = (row[v.name] ?? '').trim();
        const selected = new Set(raw.split(/\s+/).filter(Boolean));
        const newRow = { ...row };
        for (const c of v.choices) newRow[`${v.name}_${c.code}`] = selected.has(c.code) ? '1' : '0';
        return newRow;
      });
      const insertAt = headers.indexOf(v.name) + 1;
      headers = [...headers.slice(0, insertAt), ...newCols, ...headers.slice(insertAt)];
      operations.push(`« ${v.name} » (choix multiples) décomposée en ${newCols.length} colonnes binaires.`);
    }
  }

  if (options.replaceCodesWithLabels) {
    let replacedCount = 0;
    for (const h of headers) {
      const v = byName.get(h);
      if (!v || v.choices.length === 0 || v.isSelectMultiple) continue;
      const labelByCode = new Map(v.choices.map((c) => [c.code, c.label]));
      rows = rows.map((row) => {
        const code = row[h];
        if (code && labelByCode.has(code)) {
          return { ...row, [h]: labelByCode.get(code)! };
        }
        return row;
      });
      replacedCount += 1;
    }
    if (replacedCount > 0) operations.push(`Codes remplacés par les libellés sur ${replacedCount} variable(s) à choix.`);
  }

  if (options.removeTechnicalColumns) {
    const before = headers.length;
    headers = headers.filter((h) => !isTechnicalColumn(h));
    const removed = before - headers.length;
    if (removed > 0) operations.push(`${removed} colonne(s) technique(s) Kobo supprimée(s) (_id, _uuid, _submission_time…).`);
  }

  if (options.columnsToAnonymize.length > 0) {
    if (options.anonymizeMode === 'remove') {
      headers = headers.filter((h) => !options.columnsToAnonymize.includes(h));
      operations.push(`Colonnes identifiantes supprimées (anonymisation) : ${options.columnsToAnonymize.join(', ')}.`);
    } else {
      rows = rows.map((row) => {
        const newRow = { ...row };
        for (const c of options.columnsToAnonymize) if (c in newRow) newRow[c] = 'MASQUÉ';
        return newRow;
      });
      operations.push(`Colonnes identifiantes masquées (anonymisation) : ${options.columnsToAnonymize.join(', ')}.`);
    }
  }

  const finalHeaders = headers;
  const finalRows = rows.map((row) => {
    const clean: Record<string, string> = {};
    for (const h of finalHeaders) clean[h] = row[h] ?? '';
    return clean;
  });

  return { dataset: { fileName: dataset.fileName, headers: finalHeaders, rows: finalRows }, operations };
}
