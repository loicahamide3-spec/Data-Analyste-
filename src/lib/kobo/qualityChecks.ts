import type { KoboDataset } from './importKobo';
import type { DictVariable } from '../scripts/dictionary';
import { isTechnicalColumn } from './technicalColumns';

export interface CompletenessRow {
  column: string;
  filled: number;
  total: number;
  rate: number;
}

export interface OutlierRow {
  column: string;
  count: number;
  source: 'constraint' | 'statistique';
  detail: string;
}

export interface DuplicateGroup {
  key: string;
  rowIndexes: number[];
}

export interface CollectionStats {
  totalSubmissions: number;
  averageDurationMinutes: number | null;
  byEnumerator: { name: string; count: number }[];
}

export interface QualityReport {
  completeness: CompletenessRow[];
  outliers: OutlierRow[];
  duplicates: DuplicateGroup[];
  stats: CollectionStats;
}

function parseRangeConstraint(constraint: string): { min?: number; max?: number } {
  const result: { min?: number; max?: number } = {};
  const geMatch = constraint.match(/\.\s*>=\s*(-?\d+(\.\d+)?)/);
  const gtMatch = constraint.match(/\.\s*>\s*(-?\d+(\.\d+)?)/);
  const leMatch = constraint.match(/\.\s*<=\s*(-?\d+(\.\d+)?)/);
  const ltMatch = constraint.match(/\.\s*<\s*(-?\d+(\.\d+)?)/);
  if (geMatch) result.min = parseFloat(geMatch[1]);
  else if (gtMatch) result.min = parseFloat(gtMatch[1]);
  if (leMatch) result.max = parseFloat(leMatch[1]);
  else if (ltMatch) result.max = parseFloat(ltMatch[1]);
  return result;
}

export function computeCompleteness(dataset: KoboDataset): CompletenessRow[] {
  const total = dataset.rows.length;
  return dataset.headers
    .filter((h) => !isTechnicalColumn(h))
    .map((column) => {
      const filled = dataset.rows.filter((r) => (r[column] ?? '').trim() !== '').length;
      return { column, filled, total, rate: total > 0 ? Math.round((filled / total) * 1000) / 10 : 0 };
    });
}

export function detectDuplicates(dataset: KoboDataset): DuplicateGroup[] {
  const analysisColumns = dataset.headers.filter((h) => !isTechnicalColumn(h));
  const groups = new Map<string, number[]>();
  dataset.rows.forEach((row, idx) => {
    const key = analysisColumns.map((c) => row[c] ?? '').join('␟');
    const list = groups.get(key) ?? [];
    list.push(idx);
    groups.set(key, list);
  });
  return Array.from(groups.entries())
    .filter(([, idxs]) => idxs.length > 1)
    .map(([key, rowIndexes]) => ({ key, rowIndexes }));
}

function isNumericColumn(dataset: KoboDataset, column: string): boolean {
  const values = dataset.rows.map((r) => r[column]).filter((v) => v && v.trim() !== '');
  if (values.length === 0) return false;
  const numericCount = values.filter((v) => !Number.isNaN(Number(v))).length;
  return numericCount / values.length > 0.9;
}

export function detectOutliers(dataset: KoboDataset, variables: DictVariable[], iqrFactor: number): OutlierRow[] {
  const outliers: OutlierRow[] = [];
  const byName = new Map(variables.map((v) => [v.name, v]));

  for (const column of dataset.headers) {
    if (isTechnicalColumn(column)) continue;
    if (!isNumericColumn(dataset, column)) continue;

    const values = dataset.rows
      .map((r) => Number(r[column]))
      .filter((v) => !Number.isNaN(v));
    if (values.length === 0) continue;

    const variable = byName.get(column);
    const constraint = variable?.constraint;
    if (constraint) {
      const { min, max } = parseRangeConstraint(constraint);
      if (min !== undefined || max !== undefined) {
        const count = values.filter((v) => (min !== undefined && v < min) || (max !== undefined && v > max)).length;
        if (count > 0) {
          outliers.push({
            column,
            count,
            source: 'constraint',
            detail: `Hors de la contrainte du XLSForm (${constraint}).`,
          });
        }
        continue;
      }
    }

    // Repli statistique : méthode de l'écart interquartile.
    const sorted = [...values].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const low = q1 - iqrFactor * iqr;
    const high = q3 + iqrFactor * iqr;
    const count = values.filter((v) => v < low || v > high).length;
    if (count > 0) {
      outliers.push({
        column,
        count,
        source: 'statistique',
        detail: `En dehors de l'intervalle [${low.toFixed(1)} ; ${high.toFixed(1)}] (méthode interquartile).`,
      });
    }
  }

  return outliers;
}

function findColumn(headers: string[], patterns: RegExp[]): string | undefined {
  return headers.find((h) => patterns.some((p) => p.test(h)));
}

export function computeCollectionStats(dataset: KoboDataset): CollectionStats {
  const startCol = findColumn(dataset.headers, [/^start$/i]);
  const endCol = findColumn(dataset.headers, [/^end$/i]);
  const enumeratorCol = findColumn(dataset.headers, [/enqueteur/i, /enquêteur/i, /enumerator/i, /agent/i]);

  let averageDurationMinutes: number | null = null;
  if (startCol && endCol) {
    const durations: number[] = [];
    for (const row of dataset.rows) {
      const start = Date.parse(row[startCol]);
      const end = Date.parse(row[endCol]);
      if (!Number.isNaN(start) && !Number.isNaN(end) && end > start) {
        durations.push((end - start) / 60000);
      }
    }
    if (durations.length > 0) {
      averageDurationMinutes = Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 10) / 10;
    }
  }

  const byEnumerator: { name: string; count: number }[] = [];
  if (enumeratorCol) {
    const counts = new Map<string, number>();
    for (const row of dataset.rows) {
      const name = row[enumeratorCol]?.trim() || '(non renseigné)';
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    for (const [name, count] of counts) byEnumerator.push({ name, count });
    byEnumerator.sort((a, b) => b.count - a.count);
  }

  return { totalSubmissions: dataset.rows.length, averageDurationMinutes, byEnumerator };
}

export function buildQualityReport(dataset: KoboDataset, variables: DictVariable[], iqrFactor = 1.5): QualityReport {
  return {
    completeness: computeCompleteness(dataset),
    outliers: detectOutliers(dataset, variables, iqrFactor),
    duplicates: detectDuplicates(dataset),
    stats: computeCollectionStats(dataset),
  };
}
