// Représentation structurée d'un classeur XLSForm après lecture.

export type CellValue = string | number | boolean | null | undefined;

export interface SheetRow {
  /** Numéro de ligne tel qu'affiché dans Excel (1 = en-têtes) */
  rowNumber: number;
  values: Record<string, CellValue>;
}

export interface ParsedSheet {
  name: string;
  headers: string[];
  rows: SheetRow[];
}

export interface ParsedWorkbook {
  fileName: string;
  sheets: Record<string, ParsedSheet>;
  sheetNames: string[];
}

export type Severity = 'bloquant' | 'avertissement' | 'suggestion';

export interface ValidationIssue {
  id: string;
  severity: Severity;
  sheet: string;
  row?: number;
  column?: string;
  message: string;
  suggestion?: string;
}

export interface ValidationReport {
  issues: ValidationIssue[];
  counts: Record<Severity, number>;
  estimatedDurationMinutes: number;
  questionCount: number;
}

export function cellToString(v: CellValue): string {
  if (v === null || v === undefined) return '';
  return String(v).trim();
}
